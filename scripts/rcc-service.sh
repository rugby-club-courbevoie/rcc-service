#!/bin/bash
### BEGIN INIT INFO
# Provides: rcc-service
# Required-Start:    $local_fs $network
# Required-Stop:     $local_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Description: web service for rcc app
### END INIT INFO

# Source function library.
. /lib/lsb/init-functions

start() {
    echo "starting rcc-service"
    node /home/bruno/rcc-service &
    echo $! > /var/run/rcc-service.pid
}

stop() {
    echo "stopping rcc-service"
    kill -9 `cat /var/run/rcc-service.pid`
    rm /var/run/rcc-service.pid
}

case "$1" in
    start)
       start
       ;;
    stop)
       stop
       ;;
    restart)
       stop
       start
       ;;
    status)
       # code to check status of app comes here
       # example: status program_name
       ;;
    *)
       echo "Usage: $0 {start|stop|status|restart}"
       ;;
esac
