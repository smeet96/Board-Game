import express from "express"
import { AuthSchema } from "@repo/shared/zod-schema"
import { userStore } from "@repo/db"
import jwt from "jsonwebtoken"

const app = express()
app.use(express())
const secret = process.env.JWT_SECRET!

app.post("/signup", async (req) => {
const {data , success} = AuthSchema.safeParse(req.body)
if(!success) {
    return {error : "Invalid input"}
}

const {username , password} = data

const existingUser = await userStore.findByUsername(username)
if(existingUser) {
    return {error : "user already exists"}
}

await userStore.CreateUser(username,password)

const token = jwt.sign({email:username},secret)

return {
    message : 'user signed up successfully',
    data : {
        token 
    }
}

})

app.post("/signin", async (req) => {
    const {data , success} = AuthSchema.safeParse(req.body)
    if(!success) {
        return {
            error : "Invalid input"
        }
    }

    const {username , password} = data

    const user = await userStore.verifyUser(username,password)
    if(!user){
        return {error:"Invalid Credentials"}
    }

    const token = jwt.sign({email:username},secret)

    return {
        message : "user signed in successfully",
        data : {
            token 
        }
    }
})

const PORT = 9000

app.listen(PORT, () => {
    `server running on PORT ${PORT}`
})