// Importing Hono framework and its middleware utilities
import { Hono } from "hono";
import { poweredBy } from "hono/powered-by"
import { logger } from "hono/logger"
import dbConnect from "./db/connect";
import FavYoutubeVideosModel from "./db/fav-youtube-model";
import { streamText, stream } from "hono/streaming"
import { isValidObjectId } from "mongoose";

// Create a new Hono app instance
const app = new Hono();

// Register global middlewares
// poweredBy() adds an X-Powered-By header to all responses
app.use(poweredBy())
// logger() logs each incoming request and its response
app.use(logger())

// Connect to MongoDB before registering routes
dbConnect()
  .then(() => {

    // GET / - List all favorite YouTube video documents
    app.get("/", async (ctx) => {
      // Fetch all documents from the collection
      const documents = await FavYoutubeVideosModel.find();
      // Respond with the documents as JSON, status 200
      return ctx.json(
        documents.map((d) => d.toObject()),
        200
      )
    })

    // POST / - Create a new favorite YouTube video document
    app.post("/", async (ctx) => {
      // Parse JSON body from the request
      const formData = await ctx.req.json();
      // Remove thumbnailUrl if not provided
      if (!formData.thumbnailUrl) delete formData.thumbnailUrl

      // Create a new Mongoose model instance
      const FavYoutubeVideosObj = new FavYoutubeVideosModel(formData)

      try {
        // Save the document to the database
        const document = await FavYoutubeVideosObj.save()
        // Respond with the created document, status 201
        return ctx.json(document.toObject(), 201)
      } catch (error) {
        // Handle validation or server errors
        return ctx.json(
          (error as any)?.message || "Internal server error", 500
        )
      }
    })

    // GET /:documentId - Retrieve a single document by its ID
    app.get("/:documentId", async (ctx) => {
      // Extract documentId from route parameters
      const id = ctx.req.param("documentId")
      // Validate MongoDB ObjectId
      if (!isValidObjectId(id)) return ctx.json("Invalid ID", 400)

      // Find document by ID
      const document = await FavYoutubeVideosModel.findById(id)
      if (!document) {
        // Respond with 404 if not found
        return ctx.json("Document not found", 404)
      }
      // Respond with the found document
      return ctx.json(document.toObject(), 200)
    })

    // GET /d/:documentId - Stream the description of a document character by character
    app.get("/d/:documentId", async (ctx) => {
      // Extract documentId from route parameters
      const id = ctx.req.param("documentId")

      // Validate MongoDB ObjectId
      if (!isValidObjectId(id)) {
        return ctx.json("Invalid ID", 400)
      }

      // Find document by ID
      const document = await FavYoutubeVideosModel.findById(id)

      if (!document) {
        return ctx.json("Document not found", 404)
      }
      // Use Hono's streamText to stream the description field
      // This demonstrates Hono's streaming API for chunked responses
      return streamText((ctx), async (stream) => {
        // Listen for client aborts
        stream.onAbort(() => {
          console.log("Aborted!")
        })
        // Stream each character of the description with a short delay
        for (let i = 0; i < document.description.length; i++) {
          await stream.write(document.description[i])
          // Wait 0.05 seconds between characters for demonstration
          await stream.sleep(50)
        }
      })
    })

    // PATCH /:documentId - Update a document by its ID
    app.patch("/:documentId", async (ctx) => {
      // Extract documentId from route parameters
      const id = ctx.req.param("documentId")

      // Validate MongoDB ObjectId
      if (!isValidObjectId(id)) {
        return ctx.json("Invalid ID", 400)
      }

      // Find document by ID
      const document = await FavYoutubeVideosModel.findById(id)

      if (!document) {
        return ctx.json("Document not found", 404)
      }

      // Parse JSON body from the request
      const formData = await ctx.req.json()

      // Remove thumbnailUrl if not provided
      if (!formData.thumbnailUrl) delete formData.thumbnailUrl

      try {
        // Update the document and return the new version
        const updatedDocument = await FavYoutubeVideosModel.findByIdAndUpdate(
          id,
          formData,
          {
            new: true // Return the updated document
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
    // If MongoDB connection fails, respond to all requests with an error message
    app.get("/*", (ctx) => {
      return ctx.text(`Failed to connect mongodb: ${err.message}`)
    })
  })

// DELETE /:documentId - Delete a document by its ID
app.delete("/:documentId", async (ctx) => {
  // Extract documentId from route parameters
  const id = ctx.req.param("documentId")

  // Validate MongoDB ObjectId
  if (!isValidObjectId(id)) {
    return ctx.json("Invalid ID", 400)
  }

  try {
    // Delete the document and return the deleted document
    const deletedDocument = await FavYoutubeVideosModel.findByIdAndDelete(id)
    return ctx.json(deletedDocument?.toObject(), 200)
  } catch (error) {
    return ctx.json(
      (error as any)?.message || "Internal server error", 500
    )
  }
})


// Register a global error handler for the Hono app
// This will catch any unhandled errors in route handlers or middleware
app.onError((err, ctx) => {
  return ctx.text(`App error: ${err.message}`)
})

// Export the Hono app instance for use in the server entry point
export default app;