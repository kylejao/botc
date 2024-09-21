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

interface PlayerMessageInterface {
  index: number,
  property: string,
  value: string,
  extra: any
}

const initialGameState = {"gamestate":[],"isNight":true,"isVoteHistoryAllowed":true,"nomination":false,"votingSpeed":3000,"lockedVote":0,"isVoteInProgress":false,"markedPlayer":-1,"fabled":[]}

// const directToHost = 
function App() {
  const [myId, setMyId] = useState("");
  const [mySocket, setMySocket] = useState<WebSocket | null>(null);
  const [myChairIndex, setMyChairIndex] = useState(-1);
  const [roleMap, setRoleMap] = useState<Record<number, string>>({})
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomNoParamValue = urlParams.get('id');
    const roomNo: string = roomNoParamValue ? roomNoParamValue : "6655";
    
    var myClientId: string;
    const localStorageClientId = localStorage.getItem("clientId")
    if (localStorageClientId && localStorageClientId != "") {
      setMyId(localStorageClientId);
      myClientId = localStorageClientId;
    } else {
      myClientId = Math.random().toString(36).slice(2);
      localStorage.setItem("clientId", myClientId)
      setMyId(myClientId);
    }

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
        const receivedGameState: GameStateInterface = params;
        setGameState(receivedGameState)
        setMyChairIndex(receivedGameState.gamestate.findIndex(obj => obj["id"] === myClientId));
      } else if (requestMethod == "player") {
        console.log("Received Player Message")
        const playerParams: PlayerMessageInterface = params;
        console.log("Player Params: ", playerParams)

        console.log("Role satisfied", playerParams.property == "role")
        console.log("Index satisfied:", playerParams.index == myChairIndex)
        console.log(myChairIndex)

        if (playerParams.property == "role") {
          console.log("Setting role...")
          setRoleMap({...roleMap, [playerParams.index]: playerParams.value})
        } else {
          console.log("Requesting Game State again...")
          socket.send(JSON.stringify(["direct", {"host": ["getGamestate", myClientId]}]))           
        }
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
          {/* {JSON.stringify(x)} */}
          {
            x.id == "" ?
              <button onClick={() => {
                var i = gamestate.gamestate.indexOf(x);
                mySocket?.send(JSON.stringify(["claim",[i, myId]]))
              }
              }>{gamestate.gamestate.indexOf(x) + 1}</button>
            : x.id == myId ? <div>
                <button onClick={()=>{mySocket?.send(JSON.stringify(["claim",[-1, myId]]))}}>Stand up</button> 
                {roleMap[myChairIndex]}
                </div>
            : <>{gamestate.gamestate.indexOf(x) + 1}</>
          }
        </div>)
      }
      {/* <br/> */}
      {/* {JSON.stringify({clients})} */}
      {/* <br/> */}
      
      {/* My ID: {myId} <br/>
      My Chair Index: {myChairIndex} <br/> */}
      {/* My Role: {roleMap[myChairIndex]} <br/> */}
      {/* Roles: {JSON.stringify(roleMap)} <br/> */}
      {/* <button onClick={()=>{localStorage.setItem("clientId", "")}}>Reset User</button> */}
      </div>
    </>
  ) : <>
    No game state
  </>
}

export default App
