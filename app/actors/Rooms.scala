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

object Rooms {

  implicit val timeout = Timeout(5 second)

  sealed trait RoomsEvent
  case class GetRoom(slug: String) extends RoomsEvent
  case class SendRoom(room: ActorRef) extends RoomsEvent
  case class ErrorRoom(error: String) extends RoomsEvent
  case class CreateRoom(slug: String) extends RoomsEvent
  object CreatedRoom extends RoomsEvent
  case class DestroyRoom(slug: String) extends RoomsEvent
  object DestroyedRoom extends RoomsEvent

  lazy val ref = Akka.system.actorOf(Props[Rooms])

  var r = new scala.util.Random()

  val alphanum = "azertyuiopqsdfghjklmwxcvbn1234567890";
  def genSlug(nb: Int): String = {
    Range(0, nb).map(_ => 
      alphanum(r.nextInt(alphanum.length))
    ).mkString
  }

  def create (slug: String): Future[_] = {
    (ref ? CreateRoom(slug)).flatMap {
      case CreatedRoom => Future()
      case ErrorRoom(e) => Future.failed(new Exception(e))
    }
  }

  def destroy (slug: String): Future[_] = {
    (ref ? DestroyRoom(slug)).flatMap {
      case DestroyedRoom => Future(slug)
      case ErrorRoom(e) => Future.failed(new Exception(e))
    }
  }

  def get (slug: String): Future[_] = {
    (ref ? GetRoom(slug)).collect {
      case SendRoom(room) => room
    }
  }

  def join (slug: String, id: String): Future[(Iteratee[JsValue, _], Enumerator[JsValue])] = {
    (ref ? GetRoom(slug)).flatMap {
      case SendRoom(room) =>
        (room ? Room.Join(id)).map {
          case Room.Connected(out) => 
            val in = Iteratee.foreach[JsValue] { msg =>
              Logger.debug("Received a message from " + id + ": \n" + msg + "\n")
              (msg \ "to").asOpt[String].map { to =>
                room ! Room.Talk(id, to, (msg \ "data"))
              } getOrElse {
                room ! Room.Broadcast(id, msg)
              }
            }.map { _ =>
                room ! Room.Quit(id)
            }
            (in, out)


          case Room.CannotConnect(error) =>
            val in = Done[JsValue,Unit]((),Input.EOF)
            val out =  Enumerator[JsValue] {
              Json.obj("error" -> error)
            }.andThen(Enumerator.enumInput(Input.EOF))
            (in, out)
          
        }

      case ErrorRoom(error) =>
        val in = Done[JsValue,Unit]((),Input.EOF)
        val out =  Enumerator[JsValue] {
          Json.obj("error" -> error)
        }.andThen(Enumerator.enumInput(Input.EOF))
        Future((in, out))

    }
  }
}

class Rooms extends Actor {
  import Rooms._
  
  private var rooms: Map[String, ActorRef] = Map.empty

  def removeRoom (slug: String) = {
    rooms -= slug
    Logger.debug("Room "+slug+" destroyed.")
    Logger.debug("rooms:"+ rooms.keys)
  }

  def receive = {
    case Terminated(child) =>
      rooms.find(_._2 == child).map { case (slug, _) =>
        removeRoom(slug)
      }

    case GetRoom(slug) =>
      rooms.get(slug).map { room =>
        sender ! SendRoom(room)
      } getOrElse {
        sender ! ErrorRoom("no such room")
      }
    
    case CreateRoom(slug) =>
      if (rooms.contains(slug))
        sender ! ErrorRoom("room already exists")
      else {
        val actor = context.actorOf(Props(new Room(slug)))
        context.watch(actor)
        rooms += ((slug, actor))
        Logger.debug("Room "+slug+" created.")
        Logger.debug("rooms:"+ rooms.keys)
        sender ! CreatedRoom
      }
         
    case DestroyRoom(slug) =>
      rooms.get(slug).map { room =>
        room ! PoisonPill
        sender ! DestroyRoom
      } getOrElse {
        sender ! ErrorRoom("no such room")
      }
  }
}

object Room {

  sealed trait RoomEvent
  case class Connected(out: Enumerator[JsValue]) extends RoomEvent
  case class CannotConnect(error: String) extends RoomEvent
  case class Join(id: String) extends RoomEvent
  case class Broadcast(id: String, data: JsValue) extends RoomEvent
  case class Talk(id: String, to: String, data: JsValue) extends RoomEvent
  case class Quit(id: String)

}

class Room(slug: String) extends Actor {
  import Room._
  val name = "Room "+slug;

  private var peers: Map[String, Channel[JsValue]] = Map.empty

  def sendTo (id: String, json: JsValue) {
    peers.collect {
      case (client, channel) if client == id => channel
    } foreach { case channel =>
      channel.push(json)
    }
  }

  def broadcast (json: JsValue, except: Option[String] = None) {
    val receivers = except.map { exc => peers - exc } getOrElse(peers)
    receivers.map { case (id, peer) =>
      peer.push(json)
    }
  }

  def newPeer(id: String) = {
    Concurrent.unicast[JsValue](
      channel => {
        broadcast(Json.obj(
          "e" -> "connect",
          "id" -> id
        ))
        peers += (id -> channel)
        Logger.debug(name+": nb peers="+peers.size);
      }
    )
  }

  def kill () = {
    Logger.debug(name+" is terminating...")
    peers.map { case (id, peer) =>
      peer.eofAndEnd()
    }
    peers = Map.empty
    self ! Kill
  }

  def receive = {
    case Join(id) =>
      if(!peers.contains(id)) {
        Logger.debug(name+": new peer=" + id);
        sender ! Connected(newPeer(id))
      } else {
        sender ! CannotConnect("This ID is already taken !")
      }

    case Quit(id) =>
      peers.get(id).map { peer =>
        Logger.debug(name+": quit peer=" + id);
        peer.eofAndEnd()
        peers -= id
        Logger.debug(name+": nb peers="+peers.size);
        broadcast(Json.obj(
          "e" -> "disconnect",
          "id" -> id
        ))
        if (peers.size == 0) {
          kill()
        }
      }

    case Broadcast(id, data) => {
      broadcast(Json.obj(
        "e" -> "broadcast",
        "id" -> id,
        "data" -> data
      ), Some(id))
    }

    case Talk(id, to, data) => {
      sendTo(to, Json.obj(
        "e" -> "talk",
        "from" -> id,
        "data" -> data
      ))
    }
  }
}
