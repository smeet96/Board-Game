import z from "zod"

const AuthSchema = z.object({
    username : z.string().min(2).max(100),
    password : z.string().min(6).max(100)
})

export {AuthSchema}