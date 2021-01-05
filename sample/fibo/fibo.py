
def fibo(n):
    if n < 0:
        raise ValueError('fibo error')
    if n <= 2:
        return 1
    return fibo(n-2) + fibo(n-1)
    
def pick_starts_with(ls, prefix):
    return [x for x in ls if x.startswith(prefix) ]
    
