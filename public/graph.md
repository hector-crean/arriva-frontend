```mermaid
graph TD
    subgraph "Client Side"
        C[Browser/Client]
        CMsg[ClientMessageType]
        SMsg[ServerMessageType]
    end

    subgraph "WebSocket Handler"
        WS[WebSocket Connection]
        WS_Send[ws_sender<br/>Arc<Mutex>]
        WS_Recv[ws_receiver]
        
        subgraph "Concurrent Tasks"
            RT[Receive Task<br/>subscription.recv → ws_sender]
            ST[Send Task<br/>ws_receiver → manager]
            HT[Heartbeat Task<br/>30s interval]
            
            LastPong[Last Pong Time<br/>Arc<Mutex<Instant>>]
        end
    end

    subgraph "Room Management"
        RM[RoomsManager]
        subgraph "Room"
            RoomState[Room State<br/>clients: RwLock<HashMap>]
            BC[Broadcast Channel<br/>ServerMessageType]
            Storage[Storage<br/>RwLock<Storage>]
            Presence[Presence<br/>per client]
        end
        UserSub[UserSubscription<br/>client_id + receiver]
    end

    %% Client Message Flow
    C -->|sends| CMsg
    CMsg -->|websocket| WS
    WS --> WS_Recv
    WS_Recv --> ST
    ST -->|process_message| RM
    RM -->|update| RoomState
    RM -->|broadcast| BC

    %% Server Message Flow
    BC --> UserSub
    UserSub --> RT
    RT --> WS_Send
    WS_Send -->|websocket| SMsg
    SMsg -->|receives| C

    %% Heartbeat Flow
    HT -->|Ping every 30s| WS_Send
    WS_Recv -->|Pong| LastPong
    LastPong -->|check timeout| HT

    %% State Management
    RoomState --> Storage
    RoomState --> Presence

    style WS_Send fill:#f9f,stroke:#333
    style BC fill:#bbf,stroke:#333
    style LastPong fill:#bfb,stroke:#333
    style RoomState fill:#fbb,stroke:#333

```


# WebSocket-Based Room Management System Architecture

## Overview
Our system implements a real-time room management solution using WebSocket connections, with support for presence tracking and persistent storage. The architecture follows a broadcast-based pattern where messages flow bidirectionally between clients and the server through dedicated channels.

## Message Types
We have two primary message types that flow through the system:

```rust
#[derive(Debug, Serialize, Deserialize)]
pub enum ClientMessageType {
    UpdatePresence(Presence::Update),
    UpdateStorage(Storage::Operation),
    JoinRoom(RoomId),
    LeaveRoom,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ServerMessageType<RoomId, ClientId, P, S> {
    RoomJoined {
        room_id: RoomId,
        client_id: ClientId,
    },
    RoomLeft {
        room_id: RoomId,
        client_id: ClientId,
    },
    PresenceUpdated {
        client_id: ClientId,
        timestamp: DateTime<Utc>,
        presence: P,
    },
    StorageUpdated {
        version: u64,
        operations: Vec<S::Operation>,
    },
    Ping,
}
```

## Core Components

### 1. Room Manager
The `RoomsManager` is the central coordinator that handles room creation, client management, and message distribution:

```rust
pub struct RoomsManager {
    rooms: RwLock<HashMap<RoomId, Arc<Room>>>,
}

impl RoomsManager {
    pub async fn ensure_room(&self, room_id: RoomId) -> Arc<Room> {
        let rooms = self.rooms.read().await;
        if let Some(room) = rooms.get(&room_id) {
            room.clone()
        } else {
            drop(rooms);
            let mut rooms = self.rooms.write().await;
            let room = Arc::new(Room::new(room_id));
            rooms.insert(room_id, room.clone());
            room
        }
    }
}
```

### 2. Room State
Each room maintains its own state, including connected clients and a broadcast channel:

```rust
pub struct Room {
    room_id: RoomId,
    clients: RwLock<HashMap<ClientId, ClientState>>,
    sender: broadcast::Sender<ServerMessageType>,
    storage: RwLock<Box<dyn StorageLike>>,
}

pub struct ClientState {
    forwarder: ClientForwarder,
    presence: Box<dyn PresenceLike>,
    last_seen: DateTime<Utc>,
    connection_info: ConnectionInfo,
    permissions: ClientPermissions,
}
```
