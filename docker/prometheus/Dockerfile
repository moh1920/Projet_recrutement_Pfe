FROM prom/prometheus:v3.4.0

COPY prometheus.yml /etc/prometheus/prometheus.yml

EXPOSE 9091

CMD [ \
  "--config.file=/etc/prometheus/prometheus.yml", \
  "--web.listen-address=:9091", \
  "--storage.tsdb.retention.time=7d", \
  "--storage.tsdb.retention.size=512MB", \
  "--web.enable-lifecycle" \
]