function reduce(fun,a,init){
	b = init;
	for(i=0;i<a.length;i++){
		b=fun(a[i],b);
	}
	return b;
}

function compose(funA,funB){
	return function(x){
		return funA(funB(x))
	}
}

function map(fun,a){
	b = Array(a.length);
	for(i=0; i<a.length; i++){
		b[i]=fun(a[i]);
	}
	return b;
}

function filter(op,a){
	b = Array();
	for(i=0;i<a.length;i++){
		if(op(a[i])){
			b.push(a[i]);
		}
	}
	return b;
}