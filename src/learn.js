import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { streamText, stream, streamSSE } from "hono/streaming"

let videos = []

const app = new Hono(); // Create a new Hono app instance. This is the main entry point for defining routes and middleware.

// Define a GET route for the root path
app.get("/", (ctx) => {
  // ctx: Hono context object, provides access to request (ctx.req) and response helpers (ctx.json, ctx.html, etc.)
  // ctx.html(): Sends an HTML response to the client
  return ctx.html("<h1>Hello, welcome!</h1>")
})

// Define a POST route to add a new video
app.post("/video", async (ctx) => {
  // ctx.req.json(): Parses the incoming JSON request body
  const { videoName, channelName, duration } = await ctx.req.json();

  const newVideo = {
    id: uuidv4(),
    videoName,
    channelName,
    duration
  }

  videos.push(newVideo)
  console.log(newVideo)
  // ctx.json(): Sends a JSON response to the client
  return ctx.json(newVideo)
})

// Read all data (using stream )
app.get("/videos", ctx => {
  // streamText: Hono utility for streaming text responses to the client.
  // This allows sending data in chunks, useful for large datasets or real-time updates.
  // The callback receives a stream object to write data and control timing.
  return streamText(ctx, async (stream) => {
    for (const video of videos) {
      await stream.writeln(JSON.stringify(video)) // Send each video as a JSON string
      await stream.sleep(1000) // Wait 1 second between each chunk (simulates streaming)
    }
  })
})

// Read by ID
app.get("/video/:id", ctx => {
  // ctx.req.param(): Retrieves a route parameter from the URL (e.g., /video/123 -> id = 123)
  const id = ctx.req.param("id")
  const video = videos.find(video => video.id === id)

  if (!video) {
    // ctx.notFound(): Sends a 404 Not Found response
    return ctx.notFound("Video not found")
  }
  // ctx.json(): Sends the found video as a JSON response
  return ctx.json(video)
})

// Update a video by ID
app.put("/video/:id", async (ctx) => {
  // ctx.req.param(): Retrieves the 'id' parameter from the URL
  const id = ctx.req.param("id")
  let video = videos.find(video => video.id === id)

  if (!video) {
    // ctx.notFound(): Sends a 404 Not Found response if the video doesn't exist
    return ctx.notFound("Video not found")
  }

  // ctx.req.json(): Parses the incoming JSON request body for updated fields
  const { videoName, channelName, duration } = await ctx.req.json();

  video = { ...video, videoName, channelName, duration }

  // ctx.json(): Sends the updated video as a JSON response
  return ctx.json(video)
})

// Delete a video by ID
app.delete("/video/:id", async (ctx) => {
  // ctx.req.param(): Retrieves the 'id' parameter from the URL
  const id = ctx.req.param("id")

  videos = videos.filter(video => video.id !== id)

  // ctx.json(): Sends a confirmation message as a JSON response
  return ctx.json({ message: "Video deleted" })
})

// Delete all videos
app.delete("/videos", async (ctx) => {
  videos = []
  // ctx.json(): Sends a confirmation message as a JSON response
  return ctx.json({ message: "All videos deleted" })
})

export default app
