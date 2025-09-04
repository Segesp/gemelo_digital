import os, json, random, time, threading
import paho.mqtt.client as mqtt
import psycopg2
import psycopg2.extras

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/gemelo").replace("postgresql+asyncpg", "postgresql")
MQTT_URL = os.getenv("MQTT_URL", "mqtt://mqtt:1883")

def parse_mqtt_url(url: str):
    parts = url.replace("mqtt://", "").split(":")
    return parts[0], int(parts[1])

def db_conn():
    return psycopg2.connect(DATABASE_URL)

def publisher():
    host, port = parse_mqtt_url(MQTT_URL)
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(host, port, 60)
    client.loop_start()
    try:
        while True:
            payload = {
                "sensor_id": "harbor_temp",
                "value": round(18 + random.random() * 4, 2),
                "ts": int(time.time())
            }
            client.publish("gd/sensors/harbor/temp", json.dumps(payload), qos=0)
            time.sleep(2)
    finally:
        client.loop_stop()

def subscriber():
    host, port = parse_mqtt_url(MQTT_URL)
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    conn = db_conn()
    cur = conn.cursor()

    def on_message(_client, _userdata, msg):
        try:
            data = json.loads(msg.payload.decode("utf-8"))
            cur.execute(
                "INSERT INTO gd.timeseries(time, sensor_id, value, properties) VALUES(to_timestamp(%s), %s, %s, %s)",
                (data.get("ts"), data.get("sensor_id"), data.get("value"), json.dumps({}))
            )
            conn.commit()
        except Exception as e:
            conn.rollback()

    client.on_message = on_message
    client.connect(host, port, 60)
    client.subscribe("gd/sensors/#")
    client.loop_forever()

def main():
    threading.Thread(target=publisher, daemon=True).start()
    subscriber()

if __name__ == "__main__":
    main()
