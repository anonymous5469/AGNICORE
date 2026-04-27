FROM rust:1.75-slim as builder

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy Cargo files first for better caching
COPY server/agnicore/Cargo.toml server/agnicore/Cargo.lock ./

# Copy source code
COPY server/agnicore/src ./src
COPY server/agnicore/.env ./

# Build release binary
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/agnicore ./agnicore

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./agnicore"]
