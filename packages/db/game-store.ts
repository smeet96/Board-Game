import {redis} from "./redis"

type PieceColor = "White" | "Black"

type GameStatus = "waiting" | "active" | "completed" | "abandoned"

interface Player {
    id :string
    color : PieceColor
}

interface Move {
from : string
to:string
san : string
playerId : string
timeStamp : string
}

interface GameRecord {
    id :string
    players : Player[]
    moves : Move[]
    status : GameStatus
    currentTurn : PieceColor
    fen : string
    winner : string | null
    endReason : string | null
    createdAt : string
    updatedAt : string
}

const GAME_KEY = (id:string) => `game:${id}`

class GameStore {
    private async getGame(id:string):Promise<GameRecord | null> {
const game = await redis.get(GAME_KEY(id))
return game ? JSON.parse(game) : null
    }

    private async saveGame(game:GameRecord):Promise<void> {
await redis.set(GAME_KEY(game.id),JSON.stringify(game))
    }

    async createRoom(playerId:string):Promise<GameRecord> {
        const game:GameRecord = {
            id : crypto.randomUUID(),
            players : [{id:playerId,color:"White"}],
            moves : [],
            status : "waiting",
            currentTurn : "White",
            fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            winner : null,
            endReason : null,
            createdAt : new Date().toDateString(),
            updatedAt : new Date().toISOString()
        }

        await this.saveGame(game)
        return game
    }

    async getPlayerColor(gameId:string,playerId:string):Promise<PieceColor | null> {
const game = await this.getGame(gameId)
if(!game) throw new Error("game not found")
const player = game.players.find(p => p.id === playerId)
return  player?.color  ??  null   
    }

    async joinGame(playerId:string,gameId:string):Promise<GameRecord> {
        const game = await this.getGame(gameId)
        if(!game) throw new Error("game not found")
        if(game.status !== "waiting") throw new Error("game not accepting players")
        if(game.players.length >=2) throw new Error("game is full")
        if(game.players.some(p => p.id === playerId)) throw new Error("already in this game")    
            
            game.players.push({id:playerId,color:"Black"})
            game.status = "active"
            game.updatedAt = new Date().toISOString()
            await this.saveGame(game)
            return game
    }

    async addMove(
        playerId:string,
        gameId:string,
        move: {from : string , to:string , promotion?:string},
        san:string,
        fen:string
    ):Promise<GameRecord> {
const game = await this.getGame(gameId)
if(!game) throw new Error("game not found")
if(game.status !== "active") throw new Error("game is not active")

    game.moves.push({
        from : move.from,
        to : move.to,
        san : san,
        playerId : playerId,
        timeStamp : new Date().toISOString()
    })
    game.fen = fen
    game.currentTurn = game.currentTurn === "White" ? "Black" : "White"
    game.updatedAt = new Date().toISOString()

    await this.saveGame(game)
    return game
    }

    async endGame (gameId:string,winner:string,reason:string):Promise<GameRecord> {
const game = await this.getGame(gameId)
if(!game) throw new Error("game not found")   

    game.winner = winner
    game.endReason = reason
    game.status = "completed"
    game.updatedAt = new Date().toISOString()

    await this.saveGame(game)
    return game
    }

    async resign (gameId:string,playerId:string):Promise<GameRecord | null> {
    const game = await this.getGame(gameId)
    if(!game) throw new Error("game not found")
    if(game.status !== "active") throw new Error("game is not active")    

    const opponent = game.players.find(p => p.id !== playerId)
    if(!opponent) throw new Error("opponent not found")

  return  await this.endGame(gameId,opponent?.id,"resign")
    }

    async undoMove(gameId:string):Promise<GameRecord | null> {
const game = await this.getGame(gameId)
if(!game) throw new Error("game not found")
if(game.status !== "active") throw new Error("game is not active")
if(game.moves.length === 0) throw new Error("no moves played to undo")  

    game.moves.pop()
    game.currentTurn = game.currentTurn === "White" ? "Black" : "White"
    game.updatedAt = new Date().toISOString()

    return game
    }

    async findById(id:string):Promise<GameRecord | null> {
return await this.getGame(id) 
    }

    async saveGamePublic(game:GameRecord):Promise<void> {
 await this.saveGame(game)
    }
}

export const gameStore = new GameStore();
export type {GameRecord, Player, Move, PieceColor, GameStatus};