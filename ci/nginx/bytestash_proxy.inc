# Shared proxy directives, included by every location in default.conf.
#
# Every X-Forwarded-* header the application reads is set here, which
# overwrites whatever the client sent. server/src/app.js sets
# trust proxy = true, so upstream these headers are attacker-controlled.
# getBaseUrl() in server/src/routes/oidcRoutes.js reads X-Forwarded-Proto,
# X-Forwarded-Host and X-Forwarded-SSL to build the OIDC redirect_uri; all
# three are pinned below.
#
# $server_name is used rather than $host on purpose. $host derives from the
# client's Host header. It is already constrained by the default-server block,
# but pinning to $server_name means the value cannot vary with client input at
# all.

proxy_pass http://bytestash:5000;
proxy_http_version 1.1;

proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $remote_addr;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host  $server_name;
proxy_set_header X-Forwarded-SSL   on;

# Neutralise any other forwarded header a client might try.
proxy_set_header Forwarded          "";
proxy_set_header X-Forwarded-Server "";
proxy_set_header X-Original-URL     "";
proxy_set_header X-Rewrite-URL      "";

proxy_connect_timeout 10s;
proxy_send_timeout    60s;
proxy_read_timeout    60s;

proxy_buffering on;
proxy_busy_buffers_size 16k;
proxy_buffers 8 16k;
