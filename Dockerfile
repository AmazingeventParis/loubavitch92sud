FROM nginx:alpine
COPY *.html /usr/share/nginx/html/
COPY *.css /usr/share/nginx/html/
COPY *.png /usr/share/nginx/html/
COPY photos /usr/share/nginx/html/photos
EXPOSE 80
