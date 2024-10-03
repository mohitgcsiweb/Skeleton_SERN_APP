import { mongoose  } from "mongoose";

mongoose.Promise = global.Promise;

import UserCollection from "./User.js";
import AudienceCollection from "./Audience.js";
import TileCollection from "./Tile.js";

export const User = UserCollection;
export const Audience = AudienceCollection;
export const Tile = TileCollection;