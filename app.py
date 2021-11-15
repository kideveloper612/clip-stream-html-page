import sqlite3
from flask import *
import logging


app = Flask(__name__)


def get_db_connection():
    conn = sqlite3.connect('./static/database.db')
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/')
def hello_world():
    return render_template('index.html', lists=[])


@app.route("/upload", methods=['POST'])
def upload_video():
    if request.method == 'POST':
        con = get_db_connection()
        try:
            video_name = request.json["videoName"]

            todos = con.execute('SELECT * from records where video="{}" order by time_slot;'.format(video_name)).fetchall()

            lists = []
            for todo in todos:
                item = {
                    "id": todo["id"],
                    "time": todo["time_slot"],
                    "concept": todo["concept"],
                    "name": todo["name"],
                    "link": todo["link"],
                }
                lists.append(item)

            msg = {
                "status": "ok",
                "lists": lists
            }

        except:
            con.rollback()
            msg = {
                "status": "error",
                "lists": []
            }

        finally:
            con.close()
            return msg


@app.route('/add', methods=['POST'])
def add_record():
    if request.method == 'POST':
        con = get_db_connection()
        try:
            data = request.json

            video = data['videoName']
            time = data['time']
            concept = data['concept']
            name = data['name']
            link = data['link']

            cur = con.cursor()
            query_str = 'SELECT * from records where video="{0}" and time_slot="{1}";'.format(video, time)
            rows = cur.execute(query_str).fetchall()
            if rows:
                cur.execute("UPDATE records SET concept = ?, name = ?, link = ? WHERE time_slot = ?",
                            (concept, name, link, time))
                msg = {
                    "status": "update",
                    "message": "Record successfully updated"
                }
            else:
                cur.execute("INSERT INTO records (video, time_slot, concept, name, link) VALUES(?, ?, ?, ?, ?)"
                            , (video, time, concept, name, link))
                msg = {
                    "status": "ok",
                    "message": "Record successfully added"
                }

            con.commit()


        except:
            con.rollback()
            msg = {
                "status": "error",
                "message": "error in insert operation"
            }

        finally:
            con.close()
            return msg


@app.route('/change', methods=['POST'])
def change_record():
    if request.method == 'POST':
        con = get_db_connection()
        try:
            data = request.json

            record_id = data['id']
            time = data['time']
            concept = data['concept']
            name = data['name']
            link = data['link']

            cur = con.cursor()

            cur.execute("UPDATE records SET time_slot = ?, concept = ?, name = ?, link = ? WHERE id = ?",
                        (time, concept, name, link, record_id))

            con.commit()
            msg = {
                "status": "ok",
                "message": "Record successfully updated"
            }

        except:
            con.rollback()
            msg = {
                "status": "error",
                "message": "error in update operation"
            }

        finally:
            con.close()
            return msg


@app.route('/remove', methods=['POST'])
def remove_record():
    if request.method == 'POST':
        con = get_db_connection()
        try:
            remove_id = request.json['id']

            cur = con.cursor()

            cur.execute("delete from records where id=?", (remove_id,))

            con.commit()
            msg = {
                "status": "ok",
                "message": "Record successfully deleted"
            }

        except Exception as e:
            logging.error(e)
            con.rollback()
            msg = {
                "status": "error",
                "message": "error in delete operation"
            }

        finally:
            con.close()
            return msg


if __name__ == '__main__':
    app.run(debug=True, port=8080)
