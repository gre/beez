package actors

import akka.actor._
import scala.concurrent.duration._
import scala.concurrent.Future
import play.api._
import play.api.libs.json._
import play.api.libs.iteratee._
import play.api.libs.concurrent._
import play.api.libs.iteratee.Concurrent._
import akka.util.Timeout
import akka.pattern.ask
import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits._

object PeersActor {

  sealed trait PeersEvent
  case class Connected(out: Enumerator[JsValue]) extends PeersEvent
  case class CannotConnect(error: String) extends PeersEvent
  case class Join(id: String) extends PeersEvent
  case class Talk(id: String, to: String, data: JsValue) extends PeersEvent
  case class Quit(id: String)

  lazy val ref = Akka.system.actorOf(Props[PeersActor])

  implicit val timeout = Timeout(5 second)

  def join(id: String): Future[(Iteratee[JsValue, _], Enumerator[JsValue])] = {
    (ref ? Join(id)).map {
      case Connected(out) => {
        val in = Iteratee.foreach[JsValue] { msg =>
          println("\n" + msg + "\n")
          val maybeReceiver = (msg \ "to").asOpt[String]
          maybeReceiver.map { to =>
            ref ! Talk(id, to, (msg \ "data"))
          }.getOrElse {
            println("Missing \"to\": ignored.") 
          }
        }.map { _ =>
          ref ! Quit(id)
        }
        (in, out)
      }

      case CannotConnect(error) => {
        val in = Done[JsValue,Unit]((),Input.EOF)
        val out =  Enumerator[JsValue] {
          Json.obj("error" -> error)
        }.andThen(Enumerator.enumInput(Input.EOF))
        (in, out)
      }
    }
  }
}

class PeersActor extends Actor {
  import PeersActor._

  private var peers: Map[String, Channel[JsValue]] = Map.empty
  private var serverChannel: Option[Channel[JsValue]] = None
  private var serverEnumerator: Option[Enumerator[JsValue]] = None

  val serverId = "123456789"

  def isServer(id: String) = serverId == id

  def initServer() = {
    println("Welcome server !")
    serverEnumerator = Some(Concurrent.unicast[JsValue](
      channel => serverChannel = Some(channel),
      () => println("Channel server has ended"),
      (error, _) => println("Error with this server channel")
    ))
    serverEnumerator
  }

  def newPeer(id: String) = {
    println("Welcome peer " + id)
    Concurrent.unicast[JsValue](
      channel => peers += (id -> channel),
      onComplete = peers.filter {
        case (channelId, _) => id != channelId
      },
      onError = {
        case(error, _) => println("Error with this channel " + id)
      }
    )
  }

  def receive = {
    case Join(id) => {
      val s = sender
      serverEnumerator.map { out =>
        if(!peers.get(id).isDefined) {
          s ! Connected(newPeer(id))
        } else {
          s ! CannotConnect("This ID is alaready taken !")
        }
      } getOrElse {
        if(id == serverId) {
          s ! Connected(initServer().get)
        } else {
          s ! CannotConnect("No server connected")
        }
      }
    }

    case Talk(id, to, data) => {
      if(isServer(id)) {
        println("Server to peer " + id)
        peers.collect {
          case (client, channel) if client == to => channel
        }.foreach { channel =>
          channel.push(data)
        }
      } else {
        serverChannel.map { out =>
          println("Peer " + id + " to server")
          out.push(data)
        } getOrElse {
          println("Server channel doesn't exist")
        }
      }
    }
  }
}
