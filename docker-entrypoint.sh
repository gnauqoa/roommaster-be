#!/bin/sh
set -e

echo "🚀 Starting RoomMaster Backend..."

# Only run migrations and seeding in production
if [ "$NODE_ENV" = "production" ]; then
  # Wait for database to be ready
  echo "⏳ Waiting for database to be ready..."
  until wget --spider -q http://postgresdb:5432 2>/dev/null || nc -z postgresdb 5432; do
    echo "Database is unavailable - sleeping"
    sleep 2
  done

  echo "✅ Database is ready!"
  
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy
  
  # Seed the database based on flags
  # Use a marker file in a persistent location (volume)
  SEED_MARKER="/data/.seed_completed"
  
  if [ "$AUTO_SEED" = "true" ]; then
    if [ "$SEED_ONCE" = "true" ]; then
      # Only seed if marker file doesn't exist
      if [ ! -f "$SEED_MARKER" ]; then
        echo "🌱 Seeding database (one-time)..."
        if yarn db:seed; then
          echo "✅ Seeding completed successfully"
          mkdir -p /data
          touch "$SEED_MARKER"
          echo "📝 Seed marker created at $SEED_MARKER"
        else
          echo "⚠️  Seeding failed"
        fi
      else
        echo "ℹ️  Database already seeded (skipping)"
        echo "💡 To re-seed, delete the marker: docker-compose exec node-app rm $SEED_MARKER"
      fi
    else
      # Seed every time (not recommended for production)
      echo "🌱 Seeding database..."
      yarn db:seed || echo "⚠️  Seeding failed or already seeded"
    fi
  fi
fi

echo "🎉 Initialization complete!"

# Execute the CMD
exec "$@"
