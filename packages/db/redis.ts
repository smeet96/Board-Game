import {resolve, dirname} from "path"
import { fileURLToPath } from "url"
import Redis from "ioredis"

if(!process.env.REDIS_URL) {
    const _dirname = dirname(fileURLToPath(import.meta.url));
    const envPath = resolve(_dirname,"../../.env")
    try {
        process.loadEnvFile(envPath)
    } catch (error) {
        
    }
}

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

export const redis = new Redis(REDIS_URL)