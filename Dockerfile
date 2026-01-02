FROM node:16-alpine
WORKDIR /src/app
RUN apk add --no-cache python3 make g++
COPY package*.json .
RUN npm i -f 
COPY . .
EXPOSE 3050
CMD ["npm", "run", "rebuild:qa"]
