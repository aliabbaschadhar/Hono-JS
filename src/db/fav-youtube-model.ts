import { Schema, model, models } from 'mongoose';

export interface IFavYoutubeVideoSchema {
  title: string,
  description: string,
  thumbnailUrl?: string
  watched: boolean,
  youtuberName: string
}

const FavYoutubeVideoSchema = new Schema<IFavYoutubeVideoSchema>({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: "",
    required: false
  },
  watched: {
    type: Boolean,
    default: false,
    required: true
  },
  youtuberName: {
    type: String,
    required: true
  }
})

// Use dynamic import to avoid issues with edge runtimes and hot reloads

const FavYoutubeVideosModel = models.FavYoutubeVideo ||
  model<IFavYoutubeVideoSchema>("FavYoutubeVideo", FavYoutubeVideoSchema);
// For edge runtimes it will first check the models that does the model exists if not then it will create a new one.

export default FavYoutubeVideosModel;