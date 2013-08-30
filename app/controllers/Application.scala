package controllers

import play.api._
import play.api.mvc._

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
  
}
