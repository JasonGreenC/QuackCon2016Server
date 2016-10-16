from flask import render_template, request, url_for
import sqlite3
import requests
import json
from FlaskApp import app
from FlaskApp import models

@app.route('/', methods=['POST','GET'])
def index():
	if request.method == 'POST':
		team = request.form['team']
		play = request.form['play']
		detail = request.form['detail']
		score_one = request.form['score_one']
		score_two = request.form['score_two']
		models.insert_play(team, play, detail, score_one, score_two)

		message = {'team': team, 'play': play, 'detail': detail, 'score_one': int(score_one), 'score_two': int(score_two), 'alert':detail}
		# message = '{} {}: {} ( The score is {} to {} )'.format(team, play, detail, score_one, score_two)
		r = requests.post('http://67.171.192.151:3000/publish', params={'topic': 'HapiTest'}, data=json.dumps({'message': message}))

		plays = models.retrieve_play()
		return render_template('home.html', title="SportSync", plays=plays, score_one=score_one, score_two=score_two)
	else:
		score_one = models.last_value('score_one')
		score_two = models.last_value('score_two')
		plays = models.retrieve_play()
		return render_template('home.html', plays=plays, score_one=score_one, score_two=score_two)