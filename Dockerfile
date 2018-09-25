FROM node:6

RUN mkdir -p /rcc-staff

COPY . /rcc-staff

EXPOSE 8124

WORKDIR /rcc-staff
CMD node build/lib/index