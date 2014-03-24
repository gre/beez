/*
 * This file is part of Beez.
 *
 * Copyright 2014 Zengularity
 *
 * Beez is free software: you can redistribute it and/or modify
 * it under the terms of the AFFERO GNU General Public License as published by
 * the Free Software Foundation.
 *
 * Beez is distributed "AS-IS" AND WITHOUT ANY WARRANTY OF ANY KIND,
 * INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY,
 * NON-INFRINGEMENT, OR FITNESS FOR A PARTICULAR PURPOSE. See
 * the AFFERO GNU General Public License for the complete license terms.
 *
 * You should have received a copy of the AFFERO GNU General Public License
 * along with Beez.  If not, see <http://www.gnu.org/licenses/agpl-3.0.html>
 */
package controllers

import play.api._
import play.api.mvc._
import play.api.libs.iteratee._
import play.api.libs.json._
import actors._
import scala.util.{Success, Failure}
import play.api.libs.concurrent.Execution.Implicits._

object Application extends Controller {

  import Play.current
  private val urlPrefixSlug = Play.configuration.getString("application.urlPrefixSlug").getOrElse("http://localhost:9000/")
  def makeSlugUrl (slug: String): String = urlPrefixSlug + slug
  
  def index = Action {
    Ok(views.html.index())
  }

  def newHive = Action {
    Async {
      val slug = Rooms.genSlug(5)
      Rooms.create(slug).map { _ =>
        Found(routes.Application.hive(slug).url)
      } recover { case e =>
        Forbidden(e.getMessage)
      }
    }
  }

  def bee (slug: String) = Action { implicit r =>
    Async {
      Rooms.get(slug).map { _ =>
        Ok(views.html.bee(slug))
      } recover { case e =>
        NotFound(views.html.roomnotfound(slug))
      }
    }
  }

  def hive (slug: String) = Action { implicit r =>
    Async {
      Rooms.get(slug).map { _ =>
        Ok(views.html.hive(slug, makeSlugUrl(slug)))
      } recover { case e =>
        NotFound(views.html.roomnotfound(slug))
      }
    }
  }

  def redirectSlug (slug: String) = Action { implicit r =>
    if (r.headers.get("User-Agent").map(_.contains("Mobile")).getOrElse(false))
      Redirect(routes.Application.bee(slug))
    else
      Redirect(routes.Application.hive(slug))
  }

  def faviconIco = Action(NotFound)

  def join(slug: String, id: String) = WebSocket.async[JsValue] { request =>
    Rooms.join(slug, id)
  }
}

