FROM oven/bun:1.3.5-alpine

COPY package.json .
COPY knexfile.js .
COPY ./src ./src

CMD ["bun", "src/main.js"]
