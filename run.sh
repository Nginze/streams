#!/bin/zsh

if tmux has-session -t myapp 2>/dev/null; then
    echo "Attaching to the existing 'myapp' session..."
    tmux attach-session -t myapp
    exit 0
fi

if [[ $(sudo service postgresql status) == *"inactive"* ]]; then
    echo "Starting PostgreSQL (psql)..."
    sudo service postgresql start
else
    echo "PostgreSQL (psql) is already running."
fi

tmux new-session -d -s myapp

tmux send-keys -t myapp "cd server" Enter
tmux send-keys -t myapp "yarn run dev" Enter

tmux split-window -h -t myapp
tmux send-keys -t myapp "cd webrtc-server" Enter
tmux send-keys -t myapp "yarn run dev" Enter

tmux split-window -v -t myapp
tmux send-keys -t myapp "cd frontend" Enter
tmux send-keys -t myapp "yarn run dev" Enter

tmux attach-session -t myapp

