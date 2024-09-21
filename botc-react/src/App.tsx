import { useEffect, useState } from 'react'

const URL = "wss://clocktower.gstonegames.com:8081/"
const getURL = (roomNo: string): string => {
  return URL + roomNo
}

interface GameStateInterface {
  gamestate: Seat[],
  isNight: boolean,
  isVoteHistoryAllowed: boolean,
  nomination: boolean,
  votingSpeed: number,
  lockedVote: number,
  isVoteInProgress: boolean,
  markedPlayer: number,
  fabled: any[]
}

interface Seat {
  name: string,
  id: string,
  isDead: boolean,
  isVoteless: boolean,
  pronouns: string
}


const initialGameState = {"gamestate":[],"isNight":true,"isVoteHistoryAllowed":true,"nomination":false,"votingSpeed":3000,"lockedVote":0,"isVoteInProgress":false,"markedPlayer":-1,"fabled":[]}

// const directToHost = 
function App() {
  const [myId, setMyId] = useState("");
  const [mySocket, setMySocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomNoParamValue = urlParams.get('roomNo');
    const roomNo: string = roomNoParamValue ? roomNoParamValue : "6655";
    const myClientId = Math.random().toString(36).slice(2);
    setMyId(myClientId);
    const socket = new WebSocket(getURL(roomNo) + "/" + myClientId);

    setMySocket(socket);
    // Connection opened
    socket.addEventListener("open", () => {
      // socket.send(JSON.stringify(["fabled",[]]))
      socket.send(JSON.stringify(["direct", {"host": ["getGamestate", myClientId]}]))
      socket.send(JSON.stringify(["ping",[myClientId,"latency"]]))
    })

    // Listen for messages
    socket.addEventListener("message", (event) => {
      console.log("Message from server ", event.data);
      const [requestMethod, params] = JSON.parse(event.data);
      if (requestMethod == "ping") {
        console.log("Ping from", params)
      } else if (requestMethod == "getGameState") {
        const clientId: string = params;
        if (clients.indexOf(clientId) < 0) {
          setClients([...clients].concat([clientId]))
        }
      } else if (requestMethod == "gs") {
        setGameState(params)
      } else if (requestMethod == "player") {
        socket.send(JSON.stringify(["direct", {"host": ["getGamestate", myClientId]}]))
      } else {

      }
    })

    socket.addEventListener("close", () => {
      console.log("Closed")
    })

  }, [])
  
  const [gamestate, setGameState] = useState<GameStateInterface>(initialGameState);
  const [clients, setClients] = useState<string[]>([])

  return gamestate ? (
    <>
      <div>
      {gamestate.gamestate.map( x =>
        <div>
          {JSON.stringify(x)}
          {
            x.id == "" ?
              <button onClick={() => {
                var i = gamestate.gamestate.indexOf(x);
                mySocket?.send(JSON.stringify(["claim",[i, myId]]))
              }
              }>Claim {gamestate.gamestate.indexOf(x)}</button>
            : <></>
          }
        </div>)
      }
      <br/>
      {JSON.stringify({clients})}
      <br/>
      {myId}
      </div>
    </>
  ) : <>
    No game state
  </>
}

export default App
