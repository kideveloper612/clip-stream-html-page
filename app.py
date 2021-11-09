import sqlite3
from flask import *
import os
import json


UPLOAD_FOLDER = './uploads'
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def get_db_connection():
    conn = sqlite3.connect('./static/database.db')
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/')
def hello_world():
    conn = get_db_connection()
    todos = conn.execute('SELECT * from records order by time_slot;').fetchall()

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

    conn.close()
    return render_template('index.html', lists=lists)


@app.route('/add', methods=['POST'])
def add_record():
    if request.method == 'POST':
        try:
            data = request.json
            print(data)

            video = data['videoName']
            time = data['time']
            concept = data['concept']
            name = data['name']
            link = data['link']

            con = get_db_connection()

            cur = con.cursor()
            cur.execute("INSERT INTO records (video, time_slot, concept, name, link) VALUES(?, ?, ?, ?, ?)"
                        , (video, time, concept, name, link))

            con.commit()
            msg = {
                "status": "ok",
                "message": "Record successfully added"
            }

        except:
            con.rollback()
            msg = {
                "status": "error",
                "message": "error in insert operation"
            }

        finally:
            return msg
            con.close()


@app.route('/change', methods=['POST'])
def change_record():
    print('change record')
    return "ok"


@app.route('/remove', methods=['POST'])
def remove_record():
    print('remove record')
    return "ok"


if __name__ == '__main__':
    app.run(debug=True, port=8080)
