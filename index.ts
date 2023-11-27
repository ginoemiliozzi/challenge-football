import { Application } from 'express'
import dotenv from 'dotenv'
import App from './app'

dotenv.config()

const app: Application = App().expressApp
const port = process.env.PORT || 8000

app.listen(port, () => {
  console.log(`Server is live at http://localhost:${port}`)
})
