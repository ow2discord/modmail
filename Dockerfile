FROM oven/bun:1.3.5-alpine

COPY package.json .
COPY knexfile.js .
COPY ./src ./src

RUN bun install

CMD ["bun", "src/main.js"]
