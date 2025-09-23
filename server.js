const express = require('express');
const path = require('path');
const app = express();
app.use(express.static('public'));
app.use('/app', express.static('app'));
app.use('/algo', express.static('algo'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});