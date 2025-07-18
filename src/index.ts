import { Hono } from "hono";
import { poweredBy } from "hono/powered-by"
import { logger } from "hono/logger"
import dbConnect from "./db/connect";
import FavYoutubeVideosModel from "./db/fav-youtube-model";
import { streamText, stream } from "hono/streaming"
import { isValidObjectId } from "mongoose";

const app = new Hono();

// middlewares
app.use(poweredBy())
app.use(logger())


dbConnect()
  .then(() => {

    // GET List
    app.get("/", async (ctx) => {
      const documents = await FavYoutubeVideosModel.find();
      return ctx.json(
        documents.map((d) => d.toObject()),
        200
      )
    })

    // Create document
    app.post("/", async (ctx) => {
      const formData = await ctx.req.json();
      if (!formData.thumbnailUrl) delete formData.thumbnailUrl

      const FavYoutubeVideosObj = new FavYoutubeVideosModel(formData)

      try {
        const document = await FavYoutubeVideosObj.save()
        return ctx.json(document.toObject(), 201)
      } catch (error) {
        return ctx.json(
          (error as any)?.message || "Internal server error", 500
        )
      }
    })

    // View document
    app.get("/:documentId", async (ctx) => {
      const id = ctx.req.param("documentId")
      if (!isValidObjectId(id)) return ctx.json("Invalid ID", 400)

      const document = await FavYoutubeVideosModel.findById(id)
      if (!document) {
        return ctx.json("Document not found", 404)
      }
      return ctx.json(document.toObject(), 200)
    })

    // View using streaming
    app.get("/d/:documentId", async (ctx) => {
      const id = ctx.req.param("documentId")

      if (!isValidObjectId(id)) {
        return ctx.json("Invalid ID", 400)
      }

      const document = await FavYoutubeVideosModel.findById(id)

      if (!document) {
        return ctx.json("Document not found", 404)
      }
      // streaming
      return streamText((ctx), async (stream) => {
        stream.onAbort(() => {
          console.log("Aborted!")
        })
        for (let i = 0; i < document.description.length; i++) {
          await stream.write(document.description[i])
          //wait 0.5 seconds.
          await stream.sleep(500)

        }
      })
    })

    // Update 
    app.patch("/:documentId", async (ctx) => {
      const id = ctx.req.param("documentId")

      if (!isValidObjectId(id)) {
        return ctx.json("Invalid ID", 400)
      }

      const document = await FavYoutubeVideosModel.findById(id)

      if (!document) {
        return ctx.json("Document not found", 404)
      }

      const formData = await ctx.req.json()

      if (!formData.thumbnailUrl) delete formData.thumbnailUrl

      try {
        const updatedDocument = await FavYoutubeVideosModel.findByIdAndUpdate(
          id,
          formData,
          {
            new: true
          }
        )
        return ctx.json(updatedDocument?.toObject(), 200)
      } catch (error) {
        return ctx.json(
          (error as any)?.message || "Internal server error", 500
        )
      }
    })

  })
  .catch((err: Error) => {
    app.get("/*", (ctx) => {
      return ctx.text(`Failed to connect mongodb: ${err.message}`)
    })
  })

// Delete
app.delete("/:documentId", async (ctx) => {
  const id = ctx.req.param("documentId")

  if (!isValidObjectId(id)) {
    return ctx.json("Invalid ID", 400)
  }

  try {
    const deletedDocument = await FavYoutubeVideosModel.findByIdAndDelete(id)
    return ctx.json(deletedDocument?.toObject(), 200)
  } catch (error) {
    return ctx.json(
      (error as any)?.message || "Internal server error", 500
    )
  }
})



// If due to some reasons app= new Hono() failed then we will execute this!
app.onError((err, ctx) => {
  return ctx.text(`App error: ${err.message}`)
})

export default app;