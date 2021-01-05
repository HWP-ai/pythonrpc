
from flask import Flask, request
import random
import json

app = Flask(__name__)
lits = {}
mods = {}

def xxquote(x, lit, dups):
    if id(x) in dups:
        return None
    if x == None:
        return None
    if type(x) in [int, float, bool, str]:
        return x
    if type(x) == complex:
        return {
            'real' : x.real,
            'imag' : x.imag
        }
    if type(x) in [list, tuple, set]:
        return [ xxquote(t, lit, dups) for t in x ]
    if type(x) == dict:
        rd = {}
        for key in x:
            if (type(key) not in [int, float, bool, str, type(None)]):
                continue
            dups.add(id(x[key]))
            rd[key] = xxquote(t, lit, dups)
        return rd
    lit[id(x)] = x
    dups.add(id(x))
    return {
        'id': id(x)
    }

@app.route('/new_session', methods=['POST'])
def new_session():
    while True:
        seid = random.randint(1, 99999999)
        if seid not in lits:
            break
    print('-- New session %%%s%%' % seid)
    return json.dumps({
        'success': 1,
        'hello': 'hello, pythonrpc',
        'sessionid': seid
    })
    
@app.route('/require_module', methods=['POST'])
def require_module():
    sessionid = int(request.form['sessionid'])
    name = request.form['name']
    if sessionid not in mods:
        mods[sessionid] = {}
    if sessionid not in lits:
        lits[sessionid] = {}
    if name in mods[sessionid]:
        return json.dumps({
            'success': 1,
            'internalid': id(mods[sessionid][name])
        })
    mod = __import__(name)
    print('-- Session[%%%s%%] require module %s' % (sessionid, mod))
    lits[sessionid][id(mod)] = mod
    print(lits)
    print(mods)
    mods[sessionid][name] = mod
    return json.dumps({
        'success': 1,
        'internalid': id(mod)
    })
    
@app.route('/access_attr', methods=['POST'])
def access_attr():
    sessionid = int(request.form['sessionid'])
    if sessionid not in lits:
        lits[sessionid] = {}
    interid = int(request.form['internalid'])
    attrname = request.form['attr']
    obj = lits[sessionid].get(interid)
    print(lits[sessionid])
    print(obj)
    if not hasattr(obj, attrname):
        return json.dumps({
            'undefined': 1
        })
    attr = getattr(obj, attrname)
    attr_q = xxquote(attr, lits[sessionid], set())
    return json.dumps({
        'success': 1,
        'attr': attr_q
    })
    
@app.route('/apply_callable', methods=['POST'])
def apply_callable():
    sessionid = int(request.form['sessionid'])    
    if sessionid not in lits:
        lits[sessionid] = {}
    interid = int(request.form['internalid'])
    args = json.loads(request.form['args'])
    kwargs = json.loads(request.form['kwargs'])
    attr = lits[sessionid].get(interid, None)
    if not callable(attr) :
        return json.dumps({
           'undefined': 1
        })
    r = attr(*args, **kwargs)
    r_q = xxquote(r, lits[sessionid], set())
    if (type(r_q) == dict) and ('id' in r_q) :
        lits[id(r)] = r
    return json.dumps({
       'success': 1,
       'result': r_q
    })
    
@app.route('/del_lit_ref', methods=['POST'])
def del_lit_ref():
    sessionid = int(request.form['sessionid'])
    if sessionid not in lits:
        return json.dumps({
           'success': 1
        })
    interid = int(request.form['internalid'])
    if not hasattr(lits[sessionid], interid):
        return json.dumps({
           'success': 1
        })           
    del lits[sessionid][interid]
    return json.dumps({
       'success': 1
    })    
    
@app.route('/del_session_ref', methods=['POST'])
def del_session_ref():
    sessionid = int(request.form['sessionid'])
    if sessionid in lits:
        del lits[sessionid]
    if sessionid in mods:
        del mods[sessionid]
    return json.dumps({
       'success': 1
    })

@app.route('/debuginfo', methods=['POST'])
def debuginfo():
    debuginfo = {
        'lits': lits,
        'mods': mods
    }
    return json.dumps({
        'success': 1,
        'debuginfo': repr(debuginfo)
    })

if __name__ == '__main__':
    #help(app.run)
    app.run(port=88881, debug=True)