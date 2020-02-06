FROM node:alpine

WORKDIR /usr/app

COPY package*.json ./
RUN npm install --only=production && npm cache clean --force --loglevel=error

COPY ./dist/ .
COPY .env .

EXPOSE 8000

CMD ["npm", "run-script", "run-worker"]
