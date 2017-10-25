# 电梯沙盒

电梯沙盒是一个模拟电梯运行环境的游戏，你可以使用`javascript`代码来编写你自己的电梯逻辑，让它们在各种环境下处理任务，看看什么样的逻辑才是最人性化的电梯工作方式呢


# 游戏简介

这个游戏大致分为几个部分：`执行区域` `设置面板` `编码区域`

## 执行区域
在执行区域你可以看到你的电梯实际运行的情况，这个区域中分为两个部分
### 楼层
执行区域中每一行都是一个楼层，楼层的最左边会显示一个楼层号，表示这是第几层楼，其右边会显示在这个楼层等待的乘客以及乘客的期望目标是上还是下，通过这里可以看出一个楼层是否拥堵，是否都是期望向同一个方向移动。
### 电梯
电梯区域在楼层用户区域的右边，每一个电梯会占用一列，在层与层之间上下移动，电梯中会显示当前电梯内乘客的数量。当有乘客进入电梯后电梯这一列会用蓝色方块来表达电梯内的乘客期望到达的楼层，其中期望到达制定楼层的乘客越多颜色就会越深。

## 设置面板
点击标题栏右边的场景设置可以弹出设置面板，参数意义如下：
`楼层数` 有多少楼层
`电梯数` 有多少电梯
`电梯载客量` 每一台电梯最多可以承载多少乘客
`乘客出现频率` 乘客出现的速度，数值越大，乘客出现越频繁

## 编码区域
在界面的下方有一个可以进行`javascript`代码编辑的区域，您可以在这里编写您的电梯逻辑，然后点击下方的`运行`来测试您的逻辑。具体您应该如何编码请阅读下面的API。

# 编码逻辑API
您需要在编码区域编辑您的电梯逻辑，在这里您需要将您的逻辑都写在一个函数(`function`)里，在游戏运行时将会执行这个函数，并且传递两个参数给您，分别为`es`电梯列表 以及 `floors`楼层列表。您将需要使用它们来编写您的电梯逻辑。

## 电梯
从主函数传递过来的变量`es`是一个数组，其中包含了数个电梯对象，您可以通过`es.length`来获取当前环境下的电梯数。通过`es[0]`下标的形式可以获取对应的电梯对象。您获取到电梯对象后有以下的成员和函数可以供您使用：

### 成员
|成员名|内容|
|-|-|
|getDown:bool|电梯停留在楼层后是否接受要下楼的乘客，默认为true|
|getUp:bool|电梯停留在楼层后是否接受要上楼的乘客，默认为true|

### 方法
|方法名|内容|
|-|-|
|getFloor():int|获取当前所在的楼层（停留时有效）|
|getIdel():bool|获取当前是否在空闲状态|
|getPeoples():Array|获取当前在电梯里的乘客数组|
|moveTo(int):void|让电梯向指定的楼层移动|
|on(string,function):void|事件侦听|

### 事件
|事件名|内容|
|-|-|
|idel|电梯没有在移动时触发|

## 楼层
从主函数传递过来的变量`floors`是一个数组，其中包含了数个楼层对象，您可以通过`floors.length`来获取当前环境下的楼层数。通过`floors[0]`下标的形式可以获取对应的楼层对象。您获取到楼层对象后有以下的函数可以供您使用：

### 方法
|方法名|内容|
|-|-|
|getId():bool|获取楼层的楼层号|
|getPeoples():Array|获取当前在楼层中等待的乘客数组|



## 乘客
通过电梯或者楼层的`getPeoples`方法可以获取到对应的乘客数组，您可以通过乘客数组的数据进行一定的逻辑分析，数组中每一个乘客对象包含以下内容：

### 成员
|成员名|内容|
|-|-|
|mit:bool|用户的目标楼层|
|st:int|乘客出现时间的时间戳|


# 说明

## 电梯移动速度
电梯的移动速度和移动楼层数有关，电梯在楼层间移动所花费的时间如下：
(`楼层差`+1.5)*0.5  秒
所以电梯从一楼到三楼所花时间为：`(3-1+1.5)*0.5`=1.75 秒
电梯从一楼到二楼再到三楼所花时间为：`(2-1+1.5)*0.5*2`=2.5 秒

## 关于项目
该项目是一个开源个人项目，代码不多，可以提供给大家参考一下。也由于该项目是一个个人项目，所以非常的不成熟，还有很多部分存在着问题，如果有兴趣的可以自行修改内容或者与我交流。