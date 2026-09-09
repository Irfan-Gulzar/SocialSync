require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { initSocket } = require("./src/sockets/socket");

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

// Attach Socket.io to the same HTTP server so dashboard clients can connect
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`SocialSync Pro backend running on port ${PORT}`);
});
