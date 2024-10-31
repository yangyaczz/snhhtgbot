// utils.js
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { Account, ec, json, stark, RpcProvider, hash, CallData, Contract, cairo } from 'starknet';

dotenv.config();

const ETH_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
const erc20ABI = [
    {
        "name": "MintableToken",
        "type": "impl",
        "interface_name": "src::mintable_token_interface::IMintableToken"
    },
    {
        "name": "core::integer::u256",
        "type": "struct",
        "members": [
            {
                "name": "low",
                "type": "core::integer::u128"
            },
            {
                "name": "high",
                "type": "core::integer::u128"
            }
        ]
    },
    {
        "name": "src::mintable_token_interface::IMintableToken",
        "type": "interface",
        "items": [
            {
                "name": "permissioned_mint",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "permissioned_burn",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            }
        ]
    },
    {
        "name": "MintableTokenCamelImpl",
        "type": "impl",
        "interface_name": "src::mintable_token_interface::IMintableTokenCamel"
    },
    {
        "name": "src::mintable_token_interface::IMintableTokenCamel",
        "type": "interface",
        "items": [
            {
                "name": "permissionedMint",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "permissionedBurn",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            }
        ]
    },
    {
        "name": "Replaceable",
        "type": "impl",
        "interface_name": "src::replaceability_interface::IReplaceable"
    },
    {
        "name": "core::array::Span::<core::felt252>",
        "type": "struct",
        "members": [
            {
                "name": "snapshot",
                "type": "@core::array::Array::<core::felt252>"
            }
        ]
    },
    {
        "name": "src::replaceability_interface::EICData",
        "type": "struct",
        "members": [
            {
                "name": "eic_hash",
                "type": "core::starknet::class_hash::ClassHash"
            },
            {
                "name": "eic_init_data",
                "type": "core::array::Span::<core::felt252>"
            }
        ]
    },
    {
        "name": "core::option::Option::<src::replaceability_interface::EICData>",
        "type": "enum",
        "variants": [
            {
                "name": "Some",
                "type": "src::replaceability_interface::EICData"
            },
            {
                "name": "None",
                "type": "()"
            }
        ]
    },
    {
        "name": "core::bool",
        "type": "enum",
        "variants": [
            {
                "name": "False",
                "type": "()"
            },
            {
                "name": "True",
                "type": "()"
            }
        ]
    },
    {
        "name": "src::replaceability_interface::ImplementationData",
        "type": "struct",
        "members": [
            {
                "name": "impl_hash",
                "type": "core::starknet::class_hash::ClassHash"
            },
            {
                "name": "eic_data",
                "type": "core::option::Option::<src::replaceability_interface::EICData>"
            },
            {
                "name": "final",
                "type": "core::bool"
            }
        ]
    },
    {
        "name": "src::replaceability_interface::IReplaceable",
        "type": "interface",
        "items": [
            {
                "name": "get_upgrade_delay",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u64"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "get_impl_activation_time",
                "type": "function",
                "inputs": [
                    {
                        "name": "implementation_data",
                        "type": "src::replaceability_interface::ImplementationData"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::integer::u64"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "add_new_implementation",
                "type": "function",
                "inputs": [
                    {
                        "name": "implementation_data",
                        "type": "src::replaceability_interface::ImplementationData"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "remove_implementation",
                "type": "function",
                "inputs": [
                    {
                        "name": "implementation_data",
                        "type": "src::replaceability_interface::ImplementationData"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "replace_to",
                "type": "function",
                "inputs": [
                    {
                        "name": "implementation_data",
                        "type": "src::replaceability_interface::ImplementationData"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            }
        ]
    },
    {
        "name": "AccessControlImplExternal",
        "type": "impl",
        "interface_name": "src::access_control_interface::IAccessControl"
    },
    {
        "name": "src::access_control_interface::IAccessControl",
        "type": "interface",
        "items": [
            {
                "name": "has_role",
                "type": "function",
                "inputs": [
                    {
                        "name": "role",
                        "type": "core::felt252"
                    },
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "get_role_admin",
                "type": "function",
                "inputs": [
                    {
                        "name": "role",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::felt252"
                    }
                ],
                "state_mutability": "view"
            }
        ]
    },
    {
        "name": "RolesImpl",
        "type": "impl",
        "interface_name": "src::roles_interface::IMinimalRoles"
    },
    {
        "name": "src::roles_interface::IMinimalRoles",
        "type": "interface",
        "items": [
            {
                "name": "is_governance_admin",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "is_upgrade_governor",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "register_governance_admin",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "remove_governance_admin",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "register_upgrade_governor",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "remove_upgrade_governor",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "renounce",
                "type": "function",
                "inputs": [
                    {
                        "name": "role",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            }
        ]
    },
    {
        "name": "ERC20Impl",
        "type": "impl",
        "interface_name": "openzeppelin::token::erc20::interface::IERC20"
    },
    {
        "name": "openzeppelin::token::erc20::interface::IERC20",
        "type": "interface",
        "items": [
            {
                "name": "name",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::felt252"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "symbol",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::felt252"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "decimals",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u8"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "total_supply",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "balance_of",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "allowance",
                "type": "function",
                "inputs": [
                    {
                        "name": "owner",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "spender",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "transfer",
                "type": "function",
                "inputs": [
                    {
                        "name": "recipient",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "name": "transfer_from",
                "type": "function",
                "inputs": [
                    {
                        "name": "sender",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "recipient",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "name": "approve",
                "type": "function",
                "inputs": [
                    {
                        "name": "spender",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "external"
            }
        ]
    },
    {
        "name": "ERC20CamelOnlyImpl",
        "type": "impl",
        "interface_name": "openzeppelin::token::erc20::interface::IERC20CamelOnly"
    },
    {
        "name": "openzeppelin::token::erc20::interface::IERC20CamelOnly",
        "type": "interface",
        "items": [
            {
                "name": "totalSupply",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "balanceOf",
                "type": "function",
                "inputs": [
                    {
                        "name": "account",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "transferFrom",
                "type": "function",
                "inputs": [
                    {
                        "name": "sender",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "recipient",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "external"
            }
        ]
    },
    {
        "name": "constructor",
        "type": "constructor",
        "inputs": [
            {
                "name": "name",
                "type": "core::felt252"
            },
            {
                "name": "symbol",
                "type": "core::felt252"
            },
            {
                "name": "decimals",
                "type": "core::integer::u8"
            },
            {
                "name": "initial_supply",
                "type": "core::integer::u256"
            },
            {
                "name": "recipient",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "permitted_minter",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "provisional_governance_admin",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "upgrade_delay",
                "type": "core::integer::u64"
            }
        ]
    },
    {
        "name": "increase_allowance",
        "type": "function",
        "inputs": [
            {
                "name": "spender",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "added_value",
                "type": "core::integer::u256"
            }
        ],
        "outputs": [
            {
                "type": "core::bool"
            }
        ],
        "state_mutability": "external"
    },
    {
        "name": "decrease_allowance",
        "type": "function",
        "inputs": [
            {
                "name": "spender",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "subtracted_value",
                "type": "core::integer::u256"
            }
        ],
        "outputs": [
            {
                "type": "core::bool"
            }
        ],
        "state_mutability": "external"
    },
    {
        "name": "increaseAllowance",
        "type": "function",
        "inputs": [
            {
                "name": "spender",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "addedValue",
                "type": "core::integer::u256"
            }
        ],
        "outputs": [
            {
                "type": "core::bool"
            }
        ],
        "state_mutability": "external"
    },
    {
        "name": "decreaseAllowance",
        "type": "function",
        "inputs": [
            {
                "name": "spender",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "subtractedValue",
                "type": "core::integer::u256"
            }
        ],
        "outputs": [
            {
                "type": "core::bool"
            }
        ],
        "state_mutability": "external"
    },
    {
        "kind": "struct",
        "name": "openzeppelin::token::erc20_v070::erc20::ERC20::Transfer",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "from",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "to",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "value",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "openzeppelin::token::erc20_v070::erc20::ERC20::Approval",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "owner",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "spender",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "value",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::replaceability_interface::ImplementationAdded",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "implementation_data",
                "type": "src::replaceability_interface::ImplementationData"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::replaceability_interface::ImplementationRemoved",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "implementation_data",
                "type": "src::replaceability_interface::ImplementationData"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::replaceability_interface::ImplementationReplaced",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "implementation_data",
                "type": "src::replaceability_interface::ImplementationData"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::replaceability_interface::ImplementationFinalized",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "impl_hash",
                "type": "core::starknet::class_hash::ClassHash"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::access_control_interface::RoleGranted",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "role",
                "type": "core::felt252"
            },
            {
                "kind": "data",
                "name": "account",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "sender",
                "type": "core::starknet::contract_address::ContractAddress"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::access_control_interface::RoleRevoked",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "role",
                "type": "core::felt252"
            },
            {
                "kind": "data",
                "name": "account",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "sender",
                "type": "core::starknet::contract_address::ContractAddress"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::access_control_interface::RoleAdminChanged",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "role",
                "type": "core::felt252"
            },
            {
                "kind": "data",
                "name": "previous_admin_role",
                "type": "core::felt252"
            },
            {
                "kind": "data",
                "name": "new_admin_role",
                "type": "core::felt252"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::roles_interface::GovernanceAdminAdded",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "added_account",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "added_by",
                "type": "core::starknet::contract_address::ContractAddress"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::roles_interface::GovernanceAdminRemoved",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "removed_account",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "removed_by",
                "type": "core::starknet::contract_address::ContractAddress"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::roles_interface::UpgradeGovernorAdded",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "added_account",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "added_by",
                "type": "core::starknet::contract_address::ContractAddress"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "src::roles_interface::UpgradeGovernorRemoved",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "removed_account",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "removed_by",
                "type": "core::starknet::contract_address::ContractAddress"
            }
        ]
    },
    {
        "kind": "enum",
        "name": "openzeppelin::token::erc20_v070::erc20::ERC20::Event",
        "type": "event",
        "variants": [
            {
                "kind": "nested",
                "name": "Transfer",
                "type": "openzeppelin::token::erc20_v070::erc20::ERC20::Transfer"
            },
            {
                "kind": "nested",
                "name": "Approval",
                "type": "openzeppelin::token::erc20_v070::erc20::ERC20::Approval"
            },
            {
                "kind": "nested",
                "name": "ImplementationAdded",
                "type": "src::replaceability_interface::ImplementationAdded"
            },
            {
                "kind": "nested",
                "name": "ImplementationRemoved",
                "type": "src::replaceability_interface::ImplementationRemoved"
            },
            {
                "kind": "nested",
                "name": "ImplementationReplaced",
                "type": "src::replaceability_interface::ImplementationReplaced"
            },
            {
                "kind": "nested",
                "name": "ImplementationFinalized",
                "type": "src::replaceability_interface::ImplementationFinalized"
            },
            {
                "kind": "nested",
                "name": "RoleGranted",
                "type": "src::access_control_interface::RoleGranted"
            },
            {
                "kind": "nested",
                "name": "RoleRevoked",
                "type": "src::access_control_interface::RoleRevoked"
            },
            {
                "kind": "nested",
                "name": "RoleAdminChanged",
                "type": "src::access_control_interface::RoleAdminChanged"
            },
            {
                "kind": "nested",
                "name": "GovernanceAdminAdded",
                "type": "src::roles_interface::GovernanceAdminAdded"
            },
            {
                "kind": "nested",
                "name": "GovernanceAdminRemoved",
                "type": "src::roles_interface::GovernanceAdminRemoved"
            },
            {
                "kind": "nested",
                "name": "UpgradeGovernorAdded",
                "type": "src::roles_interface::UpgradeGovernorAdded"
            },
            {
                "kind": "nested",
                "name": "UpgradeGovernorRemoved",
                "type": "src::roles_interface::UpgradeGovernorRemoved"
            }
        ]
    }
]

//new Argent X account v0.3.0
const argentXaccountSepoliaClassHash = '0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003';

// 配置导入
const config = {
    encryptionKey: process.env.ENCRYPTION_KEY,
    storagePath: './secure_storage'
};

export function formatStarknetAddress(address) {
    // 移除 0x 前缀（如果存在）
    const cleanAddress = address.toLowerCase().replace('0x', '');

    // Starknet 地址应该是 64 个字符（32 字节）
    const targetLength = 64;

    // 计算需要补充的前导零数量
    const paddingLength = targetLength - cleanAddress.length;

    // 如果需要补零，则补充相应数量的零
    const paddedAddress = paddingLength > 0
        ? '0x' + '0'.repeat(paddingLength) + cleanAddress
        : '0x' + cleanAddress;

    return paddedAddress;
}

// 钱包生成器类
export class WalletGenerator {

    static async generateWallet() {
        // Generate public and private key pair.
        const privateKeyAX = stark.randomAddress();
        console.log('AX_ACCOUNT_PRIVATE_KEY=', privateKeyAX);
        const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
        console.log('AX_ACCOUNT_PUBLIC_KEY=', starkKeyPubAX);

        // Calculate future address of the ArgentX account
        const AXConstructorCallData = CallData.compile({
            owner: starkKeyPubAX,
            guardian: '0',
        });
        const AXcontractAddress = hash.calculateContractAddressFromHash(
            starkKeyPubAX,
            argentXaccountSepoliaClassHash,
            AXConstructorCallData,
            0
        );

        const formattedAddress = formatStarknetAddress(AXcontractAddress);

        console.log('Precalculated account address=', formattedAddress);


        return {
            address: formattedAddress,
            privateKey: privateKeyAX,
            publicKey: starkKeyPubAX,
            constructorCallData: AXConstructorCallData
        }

    }

    static async fromMnemonic(mnemonic) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: mnemonic,
            path: "m/44'/60'/0'/0/0"
        };
    }
}

// 加密工具类
export class SecurityUtils {
    static async encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            Buffer.from(config.encryptionKey, 'hex'),
            iv
        );

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            encryptedData: encrypted
        };
    }

    static async decrypt(encryptedData, iv, authTag) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(config.encryptionKey, 'hex'),
            Buffer.from(iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }
}

// 钱包存储管理类
export class WalletStorage {
    static async saveWallet(userId, walletData) {
        const encrypted = await SecurityUtils.encrypt(walletData);

        // 创建用户特定的存储目录
        const userDir = path.join(config.storagePath, userId.toString());
        await fs.mkdir(userDir, { recursive: true });

        // 保存加密数据
        await fs.writeFile(
            path.join(userDir, 'wallet.enc'),
            JSON.stringify(encrypted),
            'utf8'
        );

        return encrypted;
    }

    static async getWallet(userId) {
        const filePath = path.join(config.storagePath, userId.toString(), 'wallet.enc');
        const fileContent = await fs.readFile(filePath, 'utf8');
        const encrypted = JSON.parse(fileContent);

        return await SecurityUtils.decrypt(
            encrypted.encryptedData,
            encrypted.iv,
            encrypted.authTag
        );
    }
}

async function checkWalletExists(userId) {
    try {
        const userDir = path.join(config.storagePath, userId.toString());
        const walletPath = path.join(userDir, 'wallet.enc');
        await fs.access(walletPath);
        return true; // 文件存在
    } catch {
        return false; // 文件不存在
    }
}

export async function handleGenerateWallet(ctx) {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 安全原因，该操作只能在私聊中使用');
        }

        // 检查用户是否已有钱包
        // const hasWallet = await checkWalletExists(ctx.from.id);
        // if (hasWallet) {
        //     return ctx.reply(
        //         '❌ 你已经有一个钱包了！\n\n' +
        //         '为了安全考虑，每个用户只能创建一个钱包。\n' +
        //         '如果你需要查看现有钱包信息，请使用 /showkeys 命令。',
        //         { parse_mode: 'Markdown' }
        //     );
        // }

        // 生成新钱包
        const walletData = await WalletGenerator.generateWallet();

        // 加密保存
        await WalletStorage.saveWallet(ctx.from.id, walletData);

        // 返回公开信息
        await ctx.reply(
            '✅ 以太坊钱包已生成\n\n' +
            `地址: \`${walletData.address}\`\n\n` +
            '⚠️ 重要提示：\n' +
            '1. 私钥已安全加密保存\n' +
            '2. 使用 /showkeys 命令查看完整信息\n' +
            '3. 请立即备份并妥善保管你的密钥\n' +
            '4. 永远不要分享你的私钥',
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('Wallet generation error:', error);
        await ctx.reply('❌ 生成钱包时发生错误，请重试');
    }
}

export async function handleDeployAccount(ctx) {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 该命令只能在私聊中使用！');
        }

        // 检查用户是否已有钱包
        const hasWallet = await checkWalletExists(ctx.from.id);
        if (!hasWallet) {
            return ctx.reply(
                '❌ 你已经有一个钱包了！\n\n' +
                '为了安全考虑，每个用户只能创建一个钱包。\n' +
                '如果你需要查看现有钱包信息，请使用 /showkeys 命令。',
                { parse_mode: 'Markdown' }
            );
        }

        // 获取钱包信息
        const wallet = await WalletStorage.getWallet(ctx.from.id);

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const accountAX = new Account(provider, wallet.address, wallet.privateKey);

        const deployAccountPayload = {
            classHash: argentXaccountSepoliaClassHash,
            constructorCalldata: wallet.constructorCallData,
            contractAddress: wallet.address,
            addressSalt: wallet.publicKey,
        };

        const { transaction_hash: AXdAth, contract_address: AXcontractFinalAddress } =
            await accountAX.deployAccount(deployAccountPayload);

        console.log('✅ ArgentX wallet deployed at:', wallet.address);

        await ctx.reply(
            '✅ ArgentX wallet deployed at:', AXcontractFinalAddress,
            { parse_mode: 'Markdown' }
        );


    } catch (error) {
        console.error('Error showing keys:', error);
        await ctx.reply('❌ deploy accout error');
    }
}

export async function handleShowWallet(ctx) {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 该命令只能在私聊中使用！');
        }

        // 获取钱包信息
        const wallet = await WalletStorage.getWallet(ctx.from.id);

        // 发送加密信息
        const message = await ctx.reply(
            '🔐 钱包信息（60秒后自动删除）：\n\n' +
            `地址:\n\`${wallet.address}\`\n\n` +
            `私钥:\n\`${wallet.privateKey}\`\n\n` +
            '⚠️ 警告：\n' +
            '1. 请立即将这些信息保存到安全的离线位置\n' +
            '2. 永远不要分享你的私钥和助记词\n' +
            '3. 此消息将在60秒后自动删除',
            { parse_mode: 'Markdown' }
        );

        // 10秒后删除消息
        setTimeout(async () => {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, message.message_id);
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }, 10000);

    } catch (error) {
        console.error('Error showing keys:', error);
        await ctx.reply('❌ 获取钱包信息失败，请确保你已生成钱包');
    }
}



export async function getWalletBalance(address) {
    try {
        // 使用 Infura 或其他提供商

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });

        const tokenContract = new Contract(erc20ABI, ETH_ADDRESS, provider); //eth

        const balance = await tokenContract.balanceOf(address);

        const balanceInEth = ethers.utils.formatEther(balance);

        return balanceInEth;
    } catch (error) {
        console.error('获取余额失败:', error);
        throw error;
    }
}




// 处理查询余额的命令
export async function handleCheckBalance(ctx) {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 安全原因，该命令只能在私聊中使用');
        }

        // 获取用户的钱包信息
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ 未找到钱包信息，请先使用 /generatewallet 生成钱包');
        }

        // 查询余额
        const balance = await getWalletBalance(walletData.address);

        // 发送余额信息
        await ctx.reply(
            '💰 *钱包余额*\n\n' +
            `地址: \`${walletData.address}\`\n` +
            `余额: *${balance} ETH*\n\n` +
            '_提示: 余额每次查询可能略有延迟_',
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('查询余额失败:', error);
        await ctx.reply('❌ 查询余额失败，请稍后重试');
    }
}




// 处理查询余额的命令
export async function handleSendFauect(ctx) {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 安全原因，该命令只能在私聊中使用');
        }

        // 获取用户的钱包信息
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ 未找到钱包信息，请先使用 /generatewallet 生成钱包');
        }

        // 查询余额
        const balance = await getWalletBalance(walletData.address);

        if (ethers.utils.parseEther(balance.toString()).gt(ethers.utils.parseEther('0.0005'))) {
            return ctx.reply(
                '💰 *钱包余额*\n\n' +
                `地址: \`${walletData.address}\`\n` +
                `余额: *${balance} ETH*\n\n` +
                '❌ 已经有token了',
                { parse_mode: 'Markdown' }
            );
        }


        // send fauect
        await ctx.reply(
            '💰 *发送中*\n\n',
            { parse_mode: 'Markdown' }
        );
        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const accountFauect = new Account(provider, process.env.FACUET_ADDRESS, process.env.FACUET_PK);

        const tokenContract = new Contract(erc20ABI, ETH_ADDRESS, accountFauect); //eth
        
        const transferCall = tokenContract.populate('transfer', [walletData.address, cairo.uint256(ethers.utils.parseEther('0.001'))]);
        const res = await tokenContract.transfer(transferCall.calldata);
        await provider.waitForTransaction(res.transaction_hash);

        let url = 'https://sepolia.voyager.online/tx/' + res.transaction_hash

        console.log('tx', res.transaction_hash)

        // 发送余额信息
        await ctx.reply(
            '💰 *发送完成*\n\n' +
            `地址: \`${walletData.address}\`\n` +
            `查看tx详情: *${url}  *\n\n`,
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('发送水失败:', error);
        await ctx.reply('❌ 发送水失败，请稍后重试');
    }
}