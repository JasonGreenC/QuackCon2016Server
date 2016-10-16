import sqlite3

con = sqlite3.connect('matches.db')
cur = con.cursor()
cur.execute("SELECT last_insert_rowid()")
rowid = cur.fetchone()
con.close()

def insert_play(team, play, detail, score_one, score_two):
	con = sqlite3.connect('matches.db')
	cur = con.cursor()
	cur.execute("INSERT INTO game_test (team, play,detail, score_one, score_two) VALUES (?,?,?,?,?)", (team,play,detail,score_one,score_two))
	con.commit()
	con.close()

def retrieve_play():
	con = sqlite3.connect('matches.db')
	cur = con.cursor()
	cur.execute("SELECT team, play, detail, score_one, score_two FROM game_test")
	plays = cur.fetchall()
	con.close()
	return plays

def last_value(index):
	try:
		con = sqlite3.connect('matches.db')
		cur = con.cursor()
		cur.execute("SELECT score_one FROM game_test WHERE ID=?", rowid)
		val = cur.fetchone()
		return str(val)
	except:
		return '0'
	con.close()
	return val