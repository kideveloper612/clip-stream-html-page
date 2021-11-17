import sqlite3
from flask import *
import logging
import os
import re


app = Flask(__name__)
app.secret_key = "secret"


def get_db_connection():
    conn = sqlite3.connect('./static/database.db')
    conn.row_factory = sqlite3.Row
    return conn


@app.after_request
def after_request(response):
    response.headers.add('Accept-Ranges', 'bytes')
    return response


def get_chunk(file_name, byte1=None, byte2=None):
    full_path = "./videos/{}".format(file_name)
    file_size = os.stat(full_path).st_size
    start = 0

    if byte1 < file_size:
        start = byte1
    if byte2:
        length = byte2 + 1 - byte1
    else:
        length = file_size - start

    with open(full_path, 'rb') as f:
        f.seek(start)
        chunk = f.read(length)
    return chunk, start, length, file_size


@app.route('/video', methods=['POST'])
def get_file():
    if request.method == 'POST':
        file_name = request.json['videoFile']
        range_header = request.headers.get('Range', None)
        byte1, byte2 = 0, None
        if range_header:
            match = re.search(r'(\d+)-(\d*)', range_header)
            groups = match.groups()

            if groups[0]:
                byte1 = int(groups[0])
            if groups[1]:
                byte2 = int(groups[1])

        chunk, start, length, file_size = get_chunk(file_name, byte1, byte2)
        resp = Response(chunk, 206, mimetype='video/mp4',
                        content_type='video/mp4', direct_passthrough=True)
        resp.headers.add('Content-Range', 'bytes {0}-{1}/{2}'.format(start, start + length - 1, file_size))
        return resp


@app.route('/')
def index():
    return render_template('view.html', lists=[])


@app.route('/view')
def view():
    return redirect('/')


@app.route('/edit')
def edit():
    return render_template('edit.html', lists=[])


@app.route("/fetch", methods=['POST'])
def fetch():
    if request.method == 'POST':
        con = get_db_connection()
        try:
            video_name = request.json['videoName']

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


@app.route("/upload", methods=['POST'])
def upload_video():
    if request.method == 'POST':
        try:
            file = request.files['file']
            video_name = file.filename

            if video_name != '':
                file.save("static/videos/{}".format(video_name))

            msg = {
                "status": "ok",
            }

        except:
            msg = {
                "status": "error",
            }

        finally:
            return msg


@app.route('/update', methods=['POST'])
def add_record():
    if request.method == 'POST':
        con = get_db_connection()
        try:
            data = request.json

            record_id = data['id']
            video = data['videoName']
            time = data['time']
            concept = data['concept']
            name = data['name']
            link = data['link']

            cur = con.cursor()

            cur.execute("UPDATE records SET time_slot = ?, concept = ?, name = ?, link = ? WHERE id = ?",
                        (time, concept, name, link, record_id))

            con.commit()

            query_str = 'SELECT * from records where video="{0}" and time_slot="{1}";'.format(video, time)
            rows = cur.execute(query_str).fetchall()
            if rows:
                cur.execute("UPDATE records SET concept = ?, name = ?, link = ? WHERE video=? and time_slot = ?",
                            (concept, name, link, video, time))
                msg = {
                    "status": "ok",
                    "id": record_id,
                    "message": "Record successfully updated"
                }
            else:
                cur.execute("INSERT INTO records (video, time_slot, concept, name, link) VALUES(?, ?, ?, ?, ?)"
                            , (video, time, concept, name, link))
                msg = {
                    "status": "ok",
                    "id": record_id,
                    "message": "Record successfully updated"
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
