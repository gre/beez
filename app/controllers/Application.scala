package controllers

import play.api._
import play.api.mvc._
import play.api.libs.iteratee._
import play.api.libs.json._
import actors.PeersActor

object Application extends Controller {
  
  def index = Action {
    Ok(views.html.index())
  }

  def desktop = Action {
    Ok(views.html.desktop())
  }

  def mobile = Action {
    Ok(views.html.mobile())
  }

  def join(id: String) = WebSocket.async[JsValue] { request =>
    PeersActor.join(id)
  }
}
