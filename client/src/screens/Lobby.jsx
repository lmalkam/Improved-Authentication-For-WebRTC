import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
  
      const raw = JSON.stringify({
        email: email,
        choice: room
      });
  
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
  
      const response = await fetch("http://172.20.193.216:3001/fetchdata", requestOptions);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      const responseData = await response.json();
      console.log("Response data:", responseData);
  
      return responseData;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };
  


  const handleSubmitForm = useCallback(
    async (e) => {
      e.preventDefault();
      const response = await fetchData();
      console.log("Response:", response);
      const secret = response.sharedSecret;
      socket.emit("room:join",{ email, room : secret});
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      console.log("here" + typeof(room));
      navigate(`/room/secret`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">user ID</label>
        <input
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <label htmlFor="room">0 for patient and 1 for doctor</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <br />
        <button>Join</button>
      </form>
    </div>
  );
};

export default LobbyScreen;
