# SE1909_G5_SDN302_FinalProject

Shop quần áo (React + Express/Mongoose). Đặt lại mật khẩu nằm ở `/forgot-password` và `/reset-password/:token`.

## Forgot password environment

Copy `shop-project/backend/.env.example` to `shop-project/backend/.env`. These variables send the reset email:

| Variable | Required | Purpose |
| --- | --- | --- |
| `EMAIL_USER` | Yes, for real email | SMTP username (Gmail address) |
| `EMAIL_PASS` | Yes, for real email | SMTP password (Gmail App Password) |
| `EMAIL_HOST` | No | SMTP host, default `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP port, default `587` |
| `EMAIL_FROM` | No | From address, defaults to `EMAIL_USER` |
| `CLIENT_URL` | Yes | Frontend origin used in the reset link, e.g. `http://localhost:5173` |
| `JWT_SECRET` | Yes | Existing login token secret |
| `MONGO_URI` | Yes | Existing database connection |

If `EMAIL_USER` or `EMAIL_PASS` is empty outside production, the API does not send mail. It still returns the same success message and prints the reset link in the server log so the flow can be tested without SMTP. The response never says whether the email is registered. Reset tokens are stored as a SHA-256 hash, expire after 15 minutes, and are deleted after a successful reset. The new password is hashed by the same User pre-save hook used at registration. 
