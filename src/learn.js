import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { streamText, stream, streamSSE } from "hono/streaming"

let videos = []

const app = new Hono();

app.get("/", (ctx) => {
  return ctx.html("<h1>Hello, welcome!</h1>")
})

app.post("/video", async (ctx) => {
  const { videoName, channelName, duration } = await ctx.req.json();

  const newVideo = {
    id: uuidv4(),
    videoName,
    channelName,
    duration
  }

  videos.push(newVideo)
  console.log(newVideo)
  return ctx.json(newVideo)
})

// Read all data (using stream )

app.get("/videos", ctx => {
  return streamText(ctx, async (stream) => {
    for (const video of videos) {
      await stream.writeln(JSON.stringify(video))
      await stream.sleep(1000)
    }
  })
})

// Read by ID
app.get("/video/:id", ctx => {
  const id = ctx.req.param("id")
  const video = videos.find(video => video.id === id)

  if (!video) {
    return ctx.notFound("Video not found")
  }
  return ctx.json(video)
})

app.put("/video/:id", async (ctx) => {
  const id = ctx.req.param("id")
  let video = videos.find(video => video.id === id)

  if (!video) {
    return ctx.notFound("Video not found")
  }

  const { videoName, channelName, duration } = await ctx.req.json();

  video = { ...video, videoName, channelName, duration }

  return ctx.json(video)
})

app.delete("/video/:id", async (ctx) => {
  const id = ctx.req.param("id")

  videos = videos.filter(video => video.id !== id)

  return ctx.json({ message: "Video deleted" })
})

app.delete("/videos", async (ctx) => {
  videos = []
  return ctx.json({ message: "All videos deleted" })
})

export default app
