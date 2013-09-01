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
import play.api.Logger

object PeersActor {

  sealed trait PeersEvent
  case class Connected(out: Enumerator[JsValue]) extends PeersEvent
  case class CannotConnect(error: String) extends PeersEvent
  case class Join(id: String) extends PeersEvent
  case class Talk(id: String, to: String, data: JsValue) extends PeersEvent
  case class Quit(id: String)

  lazy val ref = Akka.system.actorOf(Props(new PeersActor("_hive_")))

  implicit val timeout = Timeout(5 second)

  def join(id: String): Future[(Iteratee[JsValue, _], Enumerator[JsValue])] = {
    (ref ? Join(id)).map {
      case Connected(out) => {
        val in = Iteratee.foreach[JsValue] { msg =>
          Logger.debug("Received a message from " + id + ": \n" + msg + "\n")
          val maybeReceiver = (msg \ "to").asOpt[String]
          maybeReceiver.map { to =>
            ref ! Talk(id, to, (msg \ "data"))
          }.getOrElse {
            Logger.debug("Message from " + id + " ignored: bad JSON format")
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

class PeersActor(serverId: String) extends Actor {
  import PeersActor._

  private var peers: Map[String, Channel[JsValue]] = Map.empty
  private var serverChannel: Option[Channel[JsValue]] = None
  private var serverEnumerator: Option[Enumerator[JsValue]] = None

  def isServer(id: String) = serverId == id

  def initServer() = {
    Logger.info("Welcome to the hive !");
    val out = Concurrent.unicast[JsValue](
      channel => serverChannel = Some(channel),
      () => Logger.warn("Hive channel has been closed properly."),
      (error, _) => Logger.error("Unexepected error with the hive channel :(")
    )
    peers.map { case (id, peer) =>
      peer.eofAndEnd()
    }
    peers = Map.empty
    serverEnumerator = Some(out)
    serverEnumerator
  }

  def newPeer(id: String) = {
    Logger.info("Welcome to the Bee " + id);
    Concurrent.unicast[JsValue](
      channel => peers += (id -> channel),
      onComplete = peers.filter {
        case (channelId, _) => id != channelId
      },
      onError = {
        case(error, _) => Logger.error("Unexepected with the bee " + id)
      }
    )
  }

  def receive = {
    case Join(id) => {
      val s = sender
      if (id == serverId) {
        serverChannel.map { channel =>
          channel.eofAndEnd()
        }
        s ! Connected(initServer().get)
      }
      else {
        serverEnumerator.map { out =>
          if(!peers.get(id).isDefined) {
            s ! Connected(newPeer(id))
          } else {
            s ! CannotConnect("This ID is already taken !")
          }
        } getOrElse {
          s ! CannotConnect("No server connected")
        }
      }
    }

    case Quit(id) => {
      if (id == serverId) {
        peers.map { case (id, peer) =>
          peer.eofAndEnd()
        }
        peers = Map.empty
        serverEnumerator = None
      }
      else {
        peers -= id
      }
    }

    case Talk(id, to, data) => {
      if(isServer(id)) {
        Logger.debug("Hive talks to the bee" + id)
        peers.collect {
          case (client, channel) if client == to => channel
        }.foreach { channel =>
          channel.push(Json.obj("data" -> data, "from" -> id))
        }
      } else {
        serverChannel.map { out =>
          Logger.debug("Bee " + id + " to the hive")
          out.push(Json.obj("data" -> data, "from" -> id))
        } getOrElse {
          Logger.error("Can't send message. Hive isn't initialized")
        }
      }
    }
  }
}
