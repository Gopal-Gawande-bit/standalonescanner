const express = require("express")
const path = require("path")
const app = express()
const PORT = 3000

// Serve static files
app.use(express.static(__dirname))

// Basic route handling
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
