

async function test_fibo(){
	var session = await open_session('http://127.0.0.1:23345');
	var fibo_mod = await session.require_module('fibo');
	var fibo = await fibo_mod.attr('fibo');
	var v = await fibo.call([5]);
	console.log(v);
	var pick_starts_with = await fibo_mod.attr('pick_starts_with');
	var v2 = await  pick_starts_with.call([
		['Abc', 'Ade', 'ccc', 'bef', 'Azzq'],
		'A'
	]);
	console.log(v2);
}

test_fibo();