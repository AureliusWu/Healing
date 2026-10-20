"""Disable authoring telemetry and deny network system calls before model imports.

Only this Python process and its children are affected. Model downloads belong
in a separate, explicit preparation step. Inference must use local model paths.
"""
import ctypes
import ctypes.util
import errno
import os


def enforce_offline():
    for key in ('ORT_DISABLE_TELEMETRY', 'HF_HUB_DISABLE_TELEMETRY', 'DO_NOT_TRACK',
                'HF_HUB_OFFLINE', 'TRANSFORMERS_OFFLINE'):
        os.environ[key] = '1'
    os.environ['TOKENIZERS_PARALLELISM'] = 'false'
    library = ctypes.util.find_library('seccomp')
    if not library:
        raise RuntimeError('A network-denying seccomp runtime is required for offline inference')
    api = ctypes.CDLL(library, use_errno=True)
    api.seccomp_init.argtypes = [ctypes.c_uint32]
    api.seccomp_init.restype = ctypes.c_void_p
    api.seccomp_syscall_resolve_name.argtypes = [ctypes.c_char_p]
    api.seccomp_syscall_resolve_name.restype = ctypes.c_int
    api.seccomp_rule_add.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_int, ctypes.c_uint]
    api.seccomp_rule_add.restype = ctypes.c_int
    api.seccomp_load.argtypes = [ctypes.c_void_p]
    api.seccomp_load.restype = ctypes.c_int
    api.seccomp_release.argtypes = [ctypes.c_void_p]
    context = api.seccomp_init(0x7fff0000)  # SCMP_ACT_ALLOW
    if not context:
        raise RuntimeError('Cannot create offline process policy')
    try:
        deny = 0x00050000 | errno.EPERM  # SCMP_ACT_ERRNO
        for name in (b'connect', b'sendto', b'sendmsg', b'sendmmsg'):
            number = api.seccomp_syscall_resolve_name(name)
            if number < 0 or api.seccomp_rule_add(context, deny, number, 0) != 0:
                raise RuntimeError('Cannot deny network syscall: ' + name.decode())
        if api.seccomp_load(context) != 0:
            raise RuntimeError('Cannot install offline process policy')
    finally:
        api.seccomp_release(context)
    return 'network_syscalls_denied_and_telemetry_disabled'
