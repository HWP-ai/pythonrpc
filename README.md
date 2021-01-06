pythonrpc
==========

在 JavaScript 环境中使用影子对象调用 python 的模块、实例、属性和方法。

Calling python module, instance, attribute or function in JavaScript Runtime with a shadowed object.

用法示例
--------

\1. 首先要安装 pythonrpc-jsclient 和 pythonrpc-pyserver。（见下文）

并不是采用将完整的 Python 嵌入到 JavaScript 的运行时的实现，而是需要开启一个特定的 Python 服务器，然后 JavaScript 运行时和这个 Python 服务器建立 http 通信。这样子的一个优点是两套运行环境是分离的，Python环境可以单独关闭、重启、重置，而且多个JavaScript可以而且只需要关联到一个Python进程等等。

\2. 开启 Python 运行时服务器。（见下文）

\3. 在 JavaScript 中打开一个 Session 。调用分在不同的 Session 上，在 JavaScript 环境中的操作，Python 服务器会自动管理、自主运行、自己操作。

在 JavaScript 中通过 open_session 打开一个新的 Session ：

```JavaScript
async function foo(){
	var session = await open_session('http://127.0.0.1:23345');
	// ...
}
```

open_session 返回的是一个封装了的 Session 类。这个类包括如下的这些方法：


|   表达式(Session)                          |   用途                                                                                                                | 
|:------------------------------------------|:---------------------------------------------------------------------------------------------------------------------|
| $string = session.prefix()                |  返回这个 session 的前缀，即 python 运行时服务器的地址。                                                                  |
| $number = session.sessionid()             |  返回这个 session 的 sessionid 。同一个 Session 在 JavaScript 和 Python 的 sessionid 数值相等。                           |
| $promise = session.require_module(name)   |  要求 Python 环境载入名字为 name 的模块，并将 JavaScript环境中可以操作这个模块的 $mod 对象通过 $promise.resolve($mod) 。    |
| $promise = session.del()                  |  清除 python 环境中与这个 session 有关的引用。                                                                            |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| |

理解 Session 的概念很重要。直观来看， Session 就像是一座桥梁，可以把一些调用 python 环境的需要传递到 JavaScript 环境中，并且 python 环境的一些东西通过 Session 传回 JavaScript 环境中。

\4. 通过影子对象操纵 python 环境中的对象。

|  表达式 (shadowed object)                  |   用途                                                                                                                | 
|:------------------------------------------|:----------------------------------------------------------------------------------------------------------------------|
| $number = $x.id()                         |  返回 $x 所对应的python对象的 id 。这个值等于 python 中的 id(obj) 的值。                                                  |
| $promise = $x.attr(name)                  |  返回 $x 所对应的python对象的名为 name 的属性的影子对象。即对应于 python 中的 obj.attr 。                                   |
| $promise = $x.call(args, kwargs)          |  控制$x 所对应的python对象以args和kwargs做一次函数执行。即对应于 python 中的 fun(*args, \*\*kwargs) 。                      |
| $promise = $x.del_ref()                   |  切断 $x 所对应的python对象和影子对象的关联。如果不手动切断关联，可能会导致python环境的内存浪费，但在相关的 session.del() 启动的时候也会自动清理。 |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| |

在 $promise.session.require_module(name) 中，通过 $promise.resolve() 的 $mod 就是一个影子对象。例如下面这段 python 代码：

```python
import random
x = random.randint(0, 50)
pushToJavaScript(x)
```

JavaScript 的这段代码将会操纵 python 环境中的进程，实现与其类似的效果：

```JavaScript
async function getRandomFromPython(){
	var session = await open_session('http://127.0.0.1:23345');
	// 打开了 session
	
	var random = await session.require_module('random');
	// python中将会 
	//     > import random
	// 这里的 random 是一个操作python中的random的影子对象
	&nbsp; &nbsp; &nbsp; &nbsp;
	var randint = await random.attr('randint');
	// 获得python中的random.randint的影子对象
	
	var x = await randint.call([0, 50]);
	console.log(x);
	// 调用 random.randint(0, 50) ，并将结果记录在 x 中。
	
}
```

\5. 没有了！如果不需要再使用 python 运行时，直接将相关的python服务器关闭即可。

安装
----

现在已经可以通过 pip 安装 python 服务器：

```bash
pip install pythonrpc_pyserver
```

在 JavaScript 中的安装：

```bash
cd jsworkspace
npm init # 初始化 package.json
npm install pythonrpc-jsclient # 安装
```

开启 python 服务器：

```
python -c "from pythonrpc_pyserver import app; app.run(port=8888)"
```

打开 node 测试一下！比如这段代码：

```javascript
// on node 
open_session = require('pythonrpc-jsclient').open_session;
async function getRandomFromPython(){
	var session = await open_session('http://127.0.0.1:8888');
	console.log('session', session);
	var random = await session.require_module('random');
	console.log('random shadow', random);
	var randint = await random.attr('randint');
	console.log('randint shadow', randint);
	var x = await randint.call([0, 50]);
	console.log('x', x);	
}
getRandomFromPython()
```

常见问答
--------

（1）

问：现在的开发大概是什么一个状态？这些已经可以用于生产环境了吗？

答：现在主要是原型论证的状态，还有许多问题没有妥善讨论。不同的生产环境可能有不同的要求，不建议未经过论证就直接用在生产环境上，无论是从正确性、可用性还是稳定性来说。

（2）

问：怎么可能在影子对象和原对象之间保持一贯性？JavaScript的表达模式和Python的表达模式如何能够建立等价的完整的完备的关联？

答：一贯性是通过 http 协议的请求/响应过程来实现的。

可能不存在等价的完整的完备的JavaScript的表达模式和Python的表达模式的关联方法，在这里的机制是，以 JavaScript 的一些基本数据类型为主（number，boolean，string，array，dict，null），如果能够转换为 JavaScript 的这些基本数据类型，就进行转换；否则就记录在一张表里，然后通过 id 进行操作。

即使是这样，仍然会出现一些问题，例如循环引用的对象：

```python
a = {}
b = {}
a['x'] = b
b['y'] = a
```

这类的对象如果要求返回到 JavaScript ，由于在进行 json 编码的时候语义会比较诡异，会采取一些消极的策略处理，因此不建议在python到JavaScript的返回值中使用这样子的数字结构。但只存在于python环境则没有关系。

长期来看，我们也不准备解决这个问题，而是直接填 null 。这是因为这个库主要是为了必要的在JavaScript 对python的调用，而不是可以完美地在JavaScript中整合python。

（3）

问：发现了一些很诡异的行为！还有bug！

答：这可能发生在 undefined 的情况。一般来说这些也是不打算解决的。但是你也可以把你的用例情况说一下，然后报个issues。

更多测试用例
------------

可以访问 [sample](sample/) 。



