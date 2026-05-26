import { createApp } from './app';

const app = createApp();
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
