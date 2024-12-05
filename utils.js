// utils.js
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { Account, ec, json, stark, RpcProvider, hash, CallData, Contract, cairo, byteArray, shortString } from 'starknet';
import { log } from 'console';
import { exit } from 'process';

dotenv.config();

const ETH_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
const RED_ENVELOPE_ADDRESS = '0x017ae406af61053d222b28456112062b93a5d0914a84f23a0d2847685d1a9c56'
const GAME_TOKEN_ADDRESS = '0x019be8d7ed4b93a4e924218a0d3e08abf0b33623d655b9c04197eb189c3f3d8c'

const PREDICTION_ADDRESS = '0x1cf027a162c27ef1de99f4b9126ff707ab2a2e26c8ba47d9f840831486ae3a3'


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

const RedEnvelopeABI = [
    {
        "type": "impl",
        "name": "RedEnvelopeImpl",
        "interface_name": "contracts::RedEnvelope::IRedEnvelope"
    },
    {
        "type": "enum",
        "name": "core::bool",
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
        "type": "struct",
        "name": "core::integer::u256",
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
        "type": "struct",
        "name": "contracts::RedEnvelope::RedEnvelope::RedEnvelopeInfo",
        "members": [
            {
                "name": "creator",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "token",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "distribution_type",
                "type": "core::bool"
            },
            {
                "name": "expiry_time",
                "type": "core::integer::u64"
            },
            {
                "name": "recipient_count",
                "type": "core::integer::u32"
            },
            {
                "name": "total_amount",
                "type": "core::integer::u256"
            },
            {
                "name": "claimed_count",
                "type": "core::integer::u32"
            },
            {
                "name": "is_active",
                "type": "core::bool"
            }
        ]
    },
    {
        "type": "interface",
        "name": "contracts::RedEnvelope::IRedEnvelope",
        "items": [
            {
                "type": "function",
                "name": "create_red_envelope",
                "inputs": [
                    {
                        "name": "token",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "distribution_type",
                        "type": "core::bool"
                    },
                    {
                        "name": "expiry_time",
                        "type": "core::integer::u64"
                    },
                    {
                        "name": "recipient_count",
                        "type": "core::integer::u32"
                    },
                    {
                        "name": "total_amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::felt252"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "claim_red_envelope",
                "inputs": [
                    {
                        "name": "envelope_sec",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "get_envelope_info",
                "inputs": [
                    {
                        "name": "envelope_id",
                        "type": "core::integer::u128"
                    }
                ],
                "outputs": [
                    {
                        "type": "contracts::RedEnvelope::RedEnvelope::RedEnvelopeInfo"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_block_timestamp",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u64"
                    }
                ],
                "state_mutability": "view"
            }
        ]
    },
    {
        "type": "constructor",
        "name": "constructor",
        "inputs": []
    },
    {
        "type": "event",
        "name": "contracts::RedEnvelope::RedEnvelope::EnvelopeCreated",
        "kind": "struct",
        "members": [
            {
                "name": "envelope_id",
                "type": "core::integer::u128",
                "kind": "data"
            },
            {
                "name": "envelope_sec",
                "type": "core::felt252",
                "kind": "data"
            },
            {
                "name": "creator",
                "type": "core::starknet::contract_address::ContractAddress",
                "kind": "data"
            },
            {
                "name": "token",
                "type": "core::starknet::contract_address::ContractAddress",
                "kind": "data"
            },
            {
                "name": "total_amount",
                "type": "core::integer::u256",
                "kind": "data"
            },
            {
                "name": "recipient_count",
                "type": "core::integer::u32",
                "kind": "data"
            }
        ]
    },
    {
        "type": "event",
        "name": "contracts::RedEnvelope::RedEnvelope::EnvelopeClaimed",
        "kind": "struct",
        "members": [
            {
                "name": "envelope_id",
                "type": "core::integer::u128",
                "kind": "data"
            },
            {
                "name": "claimer",
                "type": "core::starknet::contract_address::ContractAddress",
                "kind": "data"
            },
            {
                "name": "amount",
                "type": "core::integer::u256",
                "kind": "data"
            }
        ]
    },
    {
        "type": "event",
        "name": "contracts::RedEnvelope::RedEnvelope::EnvelopeRefunded",
        "kind": "struct",
        "members": [
            {
                "name": "envelope_id",
                "type": "core::integer::u128",
                "kind": "data"
            },
            {
                "name": "refunder",
                "type": "core::starknet::contract_address::ContractAddress",
                "kind": "data"
            },
            {
                "name": "remaining_amount",
                "type": "core::integer::u256",
                "kind": "data"
            }
        ]
    },
    {
        "type": "event",
        "name": "contracts::RedEnvelope::RedEnvelope::Event",
        "kind": "enum",
        "variants": [
            {
                "name": "EnvelopeCreated",
                "type": "contracts::RedEnvelope::RedEnvelope::EnvelopeCreated",
                "kind": "nested"
            },
            {
                "name": "EnvelopeClaimed",
                "type": "contracts::RedEnvelope::RedEnvelope::EnvelopeClaimed",
                "kind": "nested"
            },
            {
                "name": "EnvelopeRefunded",
                "type": "contracts::RedEnvelope::RedEnvelope::EnvelopeRefunded",
                "kind": "nested"
            }
        ]
    }
]

const GameTokenABI = [
    {
        "name": "MockTokenImpl",
        "type": "impl",
        "interface_name": "contracts::mock_contracts::MockToken::IMockToken"
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
        "name": "contracts::mock_contracts::MockToken::IMockToken",
        "type": "interface",
        "items": [
            {
                "name": "mint",
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
                "outputs": [],
                "state_mutability": "external"
            }
        ]
    },
    {
        "name": "ERC20Impl",
        "type": "impl",
        "interface_name": "openzeppelin_token::erc20::interface::ERC20ABI"
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
        "name": "core::byte_array::ByteArray",
        "type": "struct",
        "members": [
            {
                "name": "data",
                "type": "core::array::Array::<core::bytes_31::bytes31>"
            },
            {
                "name": "pending_word",
                "type": "core::felt252"
            },
            {
                "name": "pending_word_len",
                "type": "core::integer::u32"
            }
        ]
    },
    {
        "name": "openzeppelin_token::erc20::interface::ERC20ABI",
        "type": "interface",
        "items": [
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
            },
            {
                "name": "name",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::byte_array::ByteArray"
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
                        "type": "core::byte_array::ByteArray"
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
        "inputs": []
    },
    {
        "kind": "struct",
        "name": "openzeppelin_token::erc20::erc20::ERC20Component::Transfer",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "from",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "key",
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
        "name": "openzeppelin_token::erc20::erc20::ERC20Component::Approval",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "owner",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "key",
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
        "kind": "enum",
        "name": "openzeppelin_token::erc20::erc20::ERC20Component::Event",
        "type": "event",
        "variants": [
            {
                "kind": "nested",
                "name": "Transfer",
                "type": "openzeppelin_token::erc20::erc20::ERC20Component::Transfer"
            },
            {
                "kind": "nested",
                "name": "Approval",
                "type": "openzeppelin_token::erc20::erc20::ERC20Component::Approval"
            }
        ]
    },
    {
        "kind": "enum",
        "name": "contracts::mock_contracts::MockToken::MockToken::Event",
        "type": "event",
        "variants": [
            {
                "kind": "flat",
                "name": "ERC20Event",
                "type": "openzeppelin_token::erc20::erc20::ERC20Component::Event"
            }
        ]
    }
]

const PredictionABI = [
    {
        "type": "impl",
        "name": "MarketFactory",
        "interface_name": "contracts::Prediction::IMarketFactory"
    },
    {
        "type": "struct",
        "name": "core::byte_array::ByteArray",
        "members": [
            {
                "name": "data",
                "type": "core::array::Array::<core::bytes_31::bytes31>"
            },
            {
                "name": "pending_word",
                "type": "core::felt252"
            },
            {
                "name": "pending_word_len",
                "type": "core::integer::u32"
            }
        ]
    },
    {
        "type": "struct",
        "name": "core::integer::u256",
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
        "type": "enum",
        "name": "core::bool",
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
        "type": "struct",
        "name": "contracts::Prediction::Outcome",
        "members": [
            {
                "name": "name",
                "type": "core::felt252"
            },
            {
                "name": "bought_shares",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "type": "enum",
        "name": "core::option::Option::<contracts::Prediction::Outcome>",
        "variants": [
            {
                "name": "Some",
                "type": "contracts::Prediction::Outcome"
            },
            {
                "name": "None",
                "type": "()"
            }
        ]
    },
    {
        "type": "struct",
        "name": "contracts::Prediction::Market",
        "members": [
            {
                "name": "owner",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "token",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "name",
                "type": "core::byte_array::ByteArray"
            },
            {
                "name": "market_id",
                "type": "core::integer::u256"
            },
            {
                "name": "description",
                "type": "core::byte_array::ByteArray"
            },
            {
                "name": "outcomes",
                "type": "(contracts::Prediction::Outcome, contracts::Prediction::Outcome)"
            },
            {
                "name": "image",
                "type": "core::byte_array::ByteArray"
            },
            {
                "name": "is_settled",
                "type": "core::bool"
            },
            {
                "name": "is_active",
                "type": "core::bool"
            },
            {
                "name": "deadline",
                "type": "core::integer::u64"
            },
            {
                "name": "winning_outcome",
                "type": "core::option::Option::<contracts::Prediction::Outcome>"
            },
            {
                "name": "money_in_pool",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "type": "struct",
        "name": "contracts::Prediction::UserPosition",
        "members": [
            {
                "name": "amount",
                "type": "core::integer::u256"
            },
            {
                "name": "has_claimed",
                "type": "core::bool"
            }
        ]
    },
    {
        "type": "struct",
        "name": "contracts::Prediction::UserBet",
        "members": [
            {
                "name": "outcome",
                "type": "contracts::Prediction::Outcome"
            },
            {
                "name": "position",
                "type": "contracts::Prediction::UserPosition"
            }
        ]
    },
    {
        "type": "interface",
        "name": "contracts::Prediction::IMarketFactory",
        "items": [
            {
                "type": "function",
                "name": "create_market",
                "inputs": [
                    {
                        "name": "owner",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "token",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "name",
                        "type": "core::byte_array::ByteArray"
                    },
                    {
                        "name": "description",
                        "type": "core::byte_array::ByteArray"
                    },
                    {
                        "name": "outcomes",
                        "type": "(core::felt252, core::felt252)"
                    },
                    {
                        "name": "image",
                        "type": "core::byte_array::ByteArray"
                    },
                    {
                        "name": "deadline",
                        "type": "core::integer::u64"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "buy_shares",
                "inputs": [
                    {
                        "name": "market_id",
                        "type": "core::integer::u256"
                    },
                    {
                        "name": "token_to_mint",
                        "type": "core::integer::u8"
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
                "type": "function",
                "name": "settle_market",
                "inputs": [
                    {
                        "name": "market_id",
                        "type": "core::integer::u256"
                    },
                    {
                        "name": "winning_outcome",
                        "type": "core::integer::u8"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "claim_winnings",
                "inputs": [
                    {
                        "name": "market_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "get_market",
                "inputs": [
                    {
                        "name": "market_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "contracts::Prediction::Market"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_user_bet",
                "inputs": [
                    {
                        "name": "user",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "market_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "contracts::Prediction::UserBet"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_idx",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            }
        ]
    },
    {
        "type": "constructor",
        "name": "constructor",
        "inputs": [
            {
                "name": "owner",
                "type": "core::starknet::contract_address::ContractAddress"
            }
        ]
    },
    {
        "type": "event",
        "name": "contracts::Prediction::MarketFactory::MarketCreated",
        "kind": "struct",
        "members": [
            {
                "name": "market",
                "type": "contracts::Prediction::Market",
                "kind": "data"
            }
        ]
    },
    {
        "type": "event",
        "name": "contracts::Prediction::MarketFactory::MarketSettled",
        "kind": "struct",
        "members": [
            {
                "name": "market",
                "type": "contracts::Prediction::Market",
                "kind": "data"
            }
        ]
    },
    {
        "type": "event",
        "name": "contracts::Prediction::MarketFactory::WinningsClaimed",
        "kind": "struct",
        "members": [
            {
                "name": "user",
                "type": "core::starknet::contract_address::ContractAddress",
                "kind": "data"
            },
            {
                "name": "market",
                "type": "contracts::Prediction::Market",
                "kind": "data"
            },
            {
                "name": "outcome",
                "type": "contracts::Prediction::Outcome",
                "kind": "data"
            },
            {
                "name": "amount",
                "type": "core::integer::u256",
                "kind": "data"
            }
        ]
    },
    {
        "type": "event",
        "name": "contracts::Prediction::MarketFactory::Event",
        "kind": "enum",
        "variants": [
            {
                "name": "MarketCreated",
                "type": "contracts::Prediction::MarketFactory::MarketCreated",
                "kind": "nested"
            },
            {
                "name": "MarketSettled",
                "type": "contracts::Prediction::MarketFactory::MarketSettled",
                "kind": "nested"
            },
            {
                "name": "WinningsClaimed",
                "type": "contracts::Prediction::MarketFactory::WinningsClaimed",
                "kind": "nested"
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
        // Check if it's a private chat
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, this operation is only available in private chat');
        }

        // Check if user already has a wallet
        const hasWallet = await checkWalletExists(ctx.from.id);
        if (hasWallet) {
            return ctx.reply(
                '❌ You already have a wallet!\n\n' +
                'For security reasons, each user can only create one wallet.\n' +
                'If you need to view your existing wallet information, please use the /showkeys command.',
                { parse_mode: 'Markdown' }
            );
        }

        // Generate new wallet
        const walletData = await WalletGenerator.generateWallet();

        // Save encrypted wallet
        await WalletStorage.saveWallet(ctx.from.id, walletData);

        // Return public information
        await ctx.reply(
            '✅ *Wallet Generated Successfully*\n\n' +
            `Address: \`${walletData.address}\`\n\n` +
            '⚠️ *Important Security Notes:*\n' +
            '1. Your private key has been securely encrypted and stored\n' +
            '2. Use /showkeys command to view your complete wallet information\n' +
            '3. Please backup and safely store your keys immediately\n' +
            '4. Never share your private key with anyone',
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('Wallet generation error:', error);
        await ctx.reply('❌ An error occurred while generating wallet. Please try again.');
    }
}

export async function handleDeployAccount(ctx) {
    try {
        // Check if it's a private chat
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, this command can only be used in private chat');
        }

        // Check if user has a wallet
        const hasWallet = await checkWalletExists(ctx.from.id);
        if (!hasWallet) {
            return ctx.reply(
                '❌ Wallet not found!\n\n' +
                'Please generate a wallet first using the /generatewallet command.',
                { parse_mode: 'Markdown' }
            );
        }

        // Get wallet information
        const wallet = await WalletStorage.getWallet(ctx.from.id);
        if (!wallet) {
            return ctx.reply('❌ Failed to retrieve wallet information');
        }

        await ctx.reply('🔄 *Deploying your account...*', { parse_mode: 'Markdown' });

        // Initialize provider and account
        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const accountAX = new Account(provider, wallet.address, wallet.privateKey);

        // Prepare deployment payload
        const deployAccountPayload = {
            classHash: argentXaccountSepoliaClassHash,
            constructorCalldata: wallet.constructorCallData,
            contractAddress: wallet.address,
            addressSalt: wallet.publicKey,
        };

        // Deploy the account
        const { transaction_hash: axDeployTxHash, contract_address: axContractAddress } =
            await accountAX.deployAccount(deployAccountPayload);

        console.log('Account deployment transaction:', {
            txHash: axDeployTxHash,
            address: axContractAddress
        });

        // Send success message
        await ctx.reply(
            '✅ *Account Deployed Successfully*\n\n' +
            `Address: \`${axContractAddress}\`\n\n` +
            '📝 *Transaction Details:*\n' +
            `Transaction Hash: \`${axDeployTxHash}\`\n\n` +
            'Your wallet is now ready to use!',
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('Account deployment error:', error);

        let errorMessage = '❌ Failed to deploy account. ';
        if (error.message?.includes('insufficient funds')) {
            errorMessage += 'Insufficient funds for deployment';
        } else if (error.message?.includes('already deployed')) {
            errorMessage += 'Account is already deployed';
        } else {
            errorMessage += 'Please try again later';
        }

        await ctx.reply(errorMessage);
    }
}

export async function handleShowWallet(ctx) {
    try {
        // Check if it's a private chat
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, this command can only be used in private chat');
        }

        // Get wallet information
        const wallet = await WalletStorage.getWallet(ctx.from.id);

        if (!wallet) {
            return ctx.reply('❌ Wallet not found. Please generate a wallet first.');
        }

        // Send sensitive information
        const message = await ctx.reply(
            '🔐 *Wallet Information* (auto-delete in 10 seconds)\n\n' +
            '*Address:*\n' +
            `\`${wallet.address}\`\n\n` +
            '*Private Key:*\n' +
            `\`${wallet.privateKey}\`\n\n` +
            '⚠️ *SECURITY WARNINGS:*\n' +
            '1. Save this information to a secure offline location immediately\n' +
            '2. Never share your private key with anyone\n' +
            '3. This message will self-destruct in 10 seconds\n\n' +
            '_Please store this information safely_',
            { parse_mode: 'Markdown' }
        );

        // Delete message after 10 seconds
        setTimeout(async () => {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, message.message_id);
                // Optionally send a confirmation message
                await ctx.reply('🔒 Sensitive information has been deleted for security');
            } catch (error) {
                console.error('Error deleting sensitive message:', error);
            }
        }, 10000);

    } catch (error) {
        console.error('Failed to show wallet information:', error);
        await ctx.reply('❌ Failed to retrieve wallet information. Please ensure you have generated a wallet first.');
    }
}

export async function getWalletBalance(token, wallet) {
    try {
        // 使用 Infura 或其他提供商

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });

        const tokenContract = new Contract(erc20ABI, token, provider); //eth

        const balance = await tokenContract.balanceOf(wallet);

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
        // Check if it's a private chat
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, this command can only be used in private chat');
        }

        // Get user's wallet information
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ Wallet not found. Please use /generatewallet to create one first');
        }

        // Send loading message and store the message object
        const loadingMsg = await ctx.reply('🔄 *Checking balances...*', { parse_mode: 'Markdown' });

        // Query balances
        const ethBalance = await getWalletBalance(ETH_ADDRESS, walletData.address);
        const gtBalance = await getWalletBalance(GAME_TOKEN_ADDRESS, walletData.address);

        // Delete the loading message
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);

        // Send balance information
        await ctx.reply(
            '💰 *Wallet Balance*\n\n' +
            `Address: \`${walletData.address}\`\n\n` +
            `ETH Balance: *${ethBalance} ETH*\n` +
            `Game Token Balance: *${gtBalance} GT*\n\n` +
            '_Note: Balance updates may have a slight delay_',
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('Balance check error:', error);

        let errorMessage = '❌ Failed to check balance. ';
        if (error.message?.includes('network')) {
            errorMessage += 'Network connection error';
        } else if (error.message?.includes('rate limit')) {
            errorMessage += 'Too many requests, please try again later';
        } else {
            errorMessage += 'Please try again later';
        }

        await ctx.reply(errorMessage);
    }
}


// fashui
export async function handleSendFaucet(ctx) {
    try {
        // Check if it's a private chat
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, this command can only be used in private chat');
        }

        // Get user's wallet information
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ Wallet not found. Please use /generatewallet to create one first');
        }

        // Check current balance
        const balance = await getWalletBalance(ETH_ADDRESS, walletData.address);

        // Check if balance is already sufficient
        if (ethers.utils.parseEther(balance.toString()).gt(ethers.utils.parseEther('0.0005'))) {
            return ctx.reply(
                '💰 *Current Balance*\n\n' +
                `Address: \`${walletData.address}\`\n` +
                `Balance: *${balance} ETH*\n\n` +
                '❌ Faucet unavailable: Balance is sufficient',
                { parse_mode: 'Markdown' }
            );
        }

        // Send faucet tokens
        await ctx.reply(
            '🚰 *Processing Faucet Request*\n\n' +
            'Sending tokens to your wallet...',
            { parse_mode: 'Markdown' }
        );

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const accountFaucet = new Account(provider, process.env.FACUET_ADDRESS, process.env.FACUET_PK);

        // Execute multicall for ETH and Game Token transfer
        const multicall = await accountFaucet.execute([
            {
                contractAddress: ETH_ADDRESS,
                entrypoint: 'transfer',
                calldata: CallData.compile([
                    walletData.address,
                    cairo.uint256(ethers.utils.parseEther('0.001'))
                ])
            },
            {
                contractAddress: GAME_TOKEN_ADDRESS,
                entrypoint: 'mint',
                calldata: CallData.compile([
                    walletData.address,
                    cairo.uint256(ethers.utils.parseEther('100'))
                ])
            }
        ]);

        await provider.waitForTransaction(multicall.transaction_hash);
        const url = 'https://sepolia.voyager.online/tx/' + multicall.transaction_hash;

        // Send success message
        await ctx.reply(
            '✅ *Faucet Transfer Complete*\n\n' +
            `Recipient Address: \`${walletData.address}\`\n` +
            'Tokens Sent:\n' +
            '• 0.001 ETH\n' +
            '• 100 Game Tokens\n\n' +
            `Transaction Details: [View on Explorer](${url})`,
            {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            }
        );

    } catch (error) {
        console.error('Faucet transfer error:', error);

        let errorMessage = '❌ Faucet transfer failed. ';
        if (error.message?.includes('insufficient funds')) {
            errorMessage += 'Faucet is currently empty';
        } else if (error.message?.includes('rate limit')) {
            errorMessage += 'Please try again later (rate limit)';
        } else {
            errorMessage += 'Please try again later';
        }

        await ctx.reply(errorMessage);
    }
}



export async function handleCreateRedEnvelope(ctx) {
    try {

        if (!ctx || typeof ctx.reply !== 'function') {
            throw new Error('Invalid context object provided');
        }


        // 检查是否为私聊
        if (ctx.chat?.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, this command can only be used in private chat');
        }

        // 解析命令参数 /create_red_envelope <amount> <number>
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length !== 2) {
            return ctx.reply('❌ Invalid format. Please use: /create_red_envelope <amount> <number>');
        }

        const [amount, number] = args;
        const packetCount = Number(number);

        // 验证参数
        try {
            ethers.utils.parseEther(amount); // 验证金额格式是否正确
        } catch (error) {
            return ctx.reply('❌ 金额格式无效');
        }

        if (!Number.isInteger(packetCount) || packetCount <= 0) {
            return ctx.reply('❌ 红包数量必须是大于0的整数');
        }

        // 获取用户的钱包信息
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ 未找到钱包信息，请先使用 /generatewallet 生成钱包');
        }

        // 查询余额
        const balance = await getWalletBalance(GAME_TOKEN_ADDRESS, walletData.address);

        if (ethers.utils.parseEther(balance.toString()).lt(ethers.utils.parseEther(amount))) {
            return ctx.reply(
                '❌ 余额不足\n\n' +
                `当前余额: *${balance} TOKEN*\n` +
                `需要金额: *${amount} TOKEN*`,
                { parse_mode: 'Markdown' }
            );
        }

        // 发送创建红包交易
        await ctx.reply('💰 *创建红包中...*\n', { parse_mode: 'Markdown' });

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const account = new Account(provider, walletData.address, walletData.privateKey);

        const redEnvelopeContract = new Contract(RedEnvelopeABI, RED_ENVELOPE_ADDRESS, account);

        const parsedAmount = ethers.utils.parseEther(amount);

        // 执行 multicall: approve + create
        const multicall = await account.execute([
            {
                contractAddress: GAME_TOKEN_ADDRESS,
                entrypoint: 'approve',
                calldata: CallData.compile([
                    RED_ENVELOPE_ADDRESS,  // spender (红包合约地址)
                    parsedAmount        // amount
                ])
            },
            {
                contractAddress: RED_ENVELOPE_ADDRESS,
                entrypoint: 'create_red_envelope',
                calldata: CallData.compile([
                    GAME_TOKEN_ADDRESS,
                    true,
                    BigInt(Math.floor(Date.now() / 1000) + 24 * 60 * 60),
                    packetCount,         // recipient_count
                    cairo.uint256(parsedAmount)         // total_amount
                ])
            }
        ]);

        let res = await provider.waitForTransaction(multicall.transaction_hash);
        console.log("res", res);

        const url = 'https://sepolia.voyager.online/tx/' + multicall.transaction_hash;

        const events = redEnvelopeContract.parseEvents(res);
        const eventData = Object.values(events[0])[0];

        const envelopeSec = eventData.envelope_sec;
        const envelopeSecHex = '0x' + envelopeSec.toString(16).padStart(64, '0');


        // const redEnvelopeEvent = res.events.find(
        //     event => formatStarknetAddress(event.from_address).toLowerCase() === RED_ENVELOPE_ADDRESS.toLowerCase()
        // );

        // let sec;
        // if (redEnvelopeEvent) {
        //     console.log(redEnvelopeEvent.data);
        //     sec = redEnvelopeEvent.data[1]
        // } else {
        //     sec = 'tx界面查询'
        // }

        // 发送创建成功信息
        await ctx.reply(
            '🧧 *红包创建成功*\n\n' +
            `总金额: *${amount} TOKEN*\n` +
            `红包个数: *${packetCount}*\n` +
            `红包口令: *${envelopeSecHex}*\n` +
            `交易详情: ${url}\n\n` +
            '可以将红包分享到群组中供他人领取',
            {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            }
        );

    } catch (error) {
        console.error('创建红包失败:', error);
        await ctx.reply('❌ 创建红包失败，请稍后重试');
    }
}


export async function handleClaimRedEnvelope(ctx) {
    try {
        // 检查是否为群组消息
        // if (ctx.chat.type === 'private') {
        //     return ctx.reply('❌ 红包只能在群组中领取');
        // }

        // 解析口令参数 
        const password = ctx.message.text.split(/\s+/).filter(Boolean)[1];

        // // 验证口令格式
        // if (!password || password.length !== 66 || !password.startsWith('0x')) {
        //     return ctx.reply('❌ 无效的红包口令格式??');
        // }

        // // 验证是否是有效的十六进制
        // try {
        //     // 去掉0x前缀再转换
        //     BigInt('0x' + password.slice(2));
        // } catch (error) {
        //     return ctx.reply('❌ 无效的红包口令内容');
        // }

        // 获取用户的钱包信息
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ 未找到钱包信息，请先使用 /generatewallet 生成钱包');
        }

        // 发送领取红包交易
        await ctx.reply('🧧 *领取红包中...*\n', { parse_mode: 'Markdown' });

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const account = new Account(provider, walletData.address, walletData.privateKey);
        const redEnvelopeContract = new Contract(RedEnvelopeABI, RED_ENVELOPE_ADDRESS, account);

        // 调用合约的 claim 方法，直接传入口令字符串
        const claim = await account.execute([
            {
                contractAddress: RED_ENVELOPE_ADDRESS,
                entrypoint: 'claim_red_envelope',
                calldata: CallData.compile([
                    password  // 直接传入口令字符串
                ])
            }
        ]);

        // 等待交易完成
        const receipt = await provider.waitForTransaction(claim.transaction_hash);

        const events = redEnvelopeContract.parseEvents(receipt);
        const eventData = Object.values(events[0])[0];

        const claimAmount = eventData.amount;

        if (claimAmount) {

            const url = 'https://sepolia.voyager.online/tx/' + claim.transaction_hash;

            // 发送领取成功信息
            await ctx.reply(
                '🎉 *红包领取成功*\n\n' +
                `领取金额: *${ethers.utils.formatEther(claimAmount.toString())} TOKEN*\n` +
                `交易详情: ${url}`,
                {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                }
            );

            // 打印详细日志
            console.log("Red Envelope claimed successfully:", {
                password: password,
                amount: claimAmount,
                txHash: claim.transaction_hash,
                claimer: walletData.address
            });
        } else {
            console.log("所有事件:", receipt.events);
            throw new Error("未找到领取事件");
        }

    } catch (error) {
        console.error('领取红包失败:', error);
        console.error('错误详情:', error.message);

        // 根据错误类型返回适当的错误信息
        let errorMessage = '❌ 领取红包失败';
        if (error.message.includes('already claimed')) {
            errorMessage = '❌ 您已经领取过这个红包了';
        } else if (error.message.includes('expired')) {
            errorMessage = '❌ 这个红包已经过期了';
        } else if (error.message.includes('not found')) {
            errorMessage = '❌ 找不到这个红包';
        } else if (error.message.includes('no remaining')) {
            errorMessage = '❌ 红包已经被领完了';
        }

        await ctx.reply(errorMessage);
    }
}



export async function createRedEnvelope(ctx, amount, count) {
    try {
        // 检查是否为私聊
        if (ctx.chat?.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, this command can only be used in private chat');
        }

        // 验证参数
        try {
            ethers.utils.parseEther(amount); // 验证金额格式
        } catch (error) {
            return ctx.reply('❌ Invalid amount format');
        }

        if (!Number.isInteger(count) || count <= 0) {
            return ctx.reply('❌ Number of packets must be a positive integer');
        }

        // 获取用户的钱包信息
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ Wallet not found. Please generate a wallet first');
        }

        // 查询余额
        const balance = await getWalletBalance(GAME_TOKEN_ADDRESS, walletData.address);

        if (ethers.utils.parseEther(balance.toString()).lt(ethers.utils.parseEther(amount))) {
            return ctx.reply(
                '❌ Insufficient balance\n\n' +
                `Current balance: *${balance} TOKEN*\n` +
                `Required amount: *${amount} TOKEN*`,
                { parse_mode: 'Markdown' }
            );
        }

        // 发送创建红包交易
        await ctx.reply('💰 *Creating red packet...*\n', { parse_mode: 'Markdown' });

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const account = new Account(provider, walletData.address, walletData.privateKey);

        const redEnvelopeContract = new Contract(RedEnvelopeABI, RED_ENVELOPE_ADDRESS, account);

        const parsedAmount = ethers.utils.parseEther(amount);

        // 执行 multicall: approve + create
        const multicall = await account.execute([
            {
                contractAddress: GAME_TOKEN_ADDRESS,
                entrypoint: 'approve',
                calldata: CallData.compile([
                    RED_ENVELOPE_ADDRESS,
                    parsedAmount
                ])
            },
            {
                contractAddress: RED_ENVELOPE_ADDRESS,
                entrypoint: 'create_red_envelope',
                calldata: CallData.compile([
                    GAME_TOKEN_ADDRESS,
                    true,
                    BigInt(Math.floor(Date.now() / 1000) + 24 * 60 * 60),
                    count,
                    cairo.uint256(parsedAmount)
                ])
            }
        ]);

        let res = await provider.waitForTransaction(multicall.transaction_hash);
        console.log("res", res);

        const url = 'https://sepolia.voyager.online/tx/' + multicall.transaction_hash;

        const events = redEnvelopeContract.parseEvents(res);
        const eventData = Object.values(events[0])[0];

        const envelopeSec = eventData.envelope_sec;
        const envelopeSecHex = '0x' + envelopeSec.toString(16).padStart(64, '0');

        // 发送创建成功信息
        await ctx.reply(
            '🎉 *Red Packet Created Successfully*\n\n' +
            '📝 *Details:*\n' +
            `• Amount: *${amount} TOKEN*\n` +
            `• Packets: *${count}*\n` +
            `• Average: *${(amount / count).toFixed(2)} TOKEN*\n\n` +
            `🔍 [View Transaction](${url})\n\n` +
            '📢 *Share Instructions:*\n' +
            '1. Copy the secret key below\n' +
            '2. Share it in your group\n' +
            '3. Others can claim using this key',
            {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            }
        );

        await ctx.reply(
            '🔑 *Secret Key Below*\n' +
            'Copy the next message to share:',
            { parse_mode: 'Markdown' }
        );

        // Send only the secret key for easiest copying
        return ctx.reply(`${envelopeSecHex}`);

    } catch (error) {
        console.error('Failed to create red packet:', error);
        await ctx.reply('❌ Failed to create red packet. Please try again later');
        throw error;
    }
}



// 领取红包的核心函数
export async function claimRedEnvelope(ctx, password) {
    try {
        // 获取用户的钱包信息
        const walletData = await WalletStorage.getWallet(ctx.from.id);

        if (!walletData) {
            return ctx.reply('❌ Wallet not found. Please use /generatewallet to create one first');
        }

        // 发送领取红包交易
        await ctx.reply('🎁 *Claiming red packet...*\n', { parse_mode: 'Markdown' });

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const account = new Account(provider, walletData.address, walletData.privateKey);
        const redEnvelopeContract = new Contract(RedEnvelopeABI, RED_ENVELOPE_ADDRESS, account);

        // 调用合约的 claim 方法
        const claim = await account.execute([
            {
                contractAddress: RED_ENVELOPE_ADDRESS,
                entrypoint: 'claim_red_envelope',
                calldata: CallData.compile([password])
            }
        ]);

        // 等待交易完成
        const receipt = await provider.waitForTransaction(claim.transaction_hash);
        const events = redEnvelopeContract.parseEvents(receipt);
        const eventData = Object.values(events[0])[0];
        const claimAmount = eventData.amount;

        if (claimAmount) {
            const url = 'https://sepolia.voyager.online/tx/' + claim.transaction_hash;

            // 发送领取成功信息
            await ctx.reply(
                '🎉 *Successfully Claimed!*\n\n' +
                `Amount Received: *${ethers.utils.formatEther(claimAmount.toString())} TOKEN*\n` +
                `🔍 [View Transaction](${url})\n\n`,

                {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                }
            );

            // 打印详细日志
            console.log("Red Packet claimed successfully:", {
                password: password,
                amount: claimAmount,
                txHash: claim.transaction_hash,
                claimer: walletData.address
            });
        } else {
            console.log("All events:", receipt.events);
            throw new Error("Claim event not found");
        }

    } catch (error) {
        console.error('Failed to claim red packet:', error);
        console.error('Error details:', error.message);

        let errorMessage = '❌ Failed to claim red packet';
        if (error.message.includes('already claimed')) {
            errorMessage = '❌ You have already claimed this red packet';
        } else if (error.message.includes('expired')) {
            errorMessage = '❌ This red packet has expired';
        } else if (error.message.includes('not found')) {
            errorMessage = '❌ Red packet not found';
        } else if (error.message.includes('no remaining')) {
            errorMessage = '❌ Red packet has been fully claimed';
        }

        await ctx.reply(errorMessage);
    }
}



//  prediction

export async function handleCreatePrediction(ctx) {
    try {
        if (!ctx || typeof ctx.reply !== 'function') {
            throw new Error('Invalid context object provided');
        }

        // 检查是否为私聊
        if (ctx.chat?.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, this command can only be used in private chat');
        }

        // 解析命令参数 /createprediction name | description | optionA | optionB | hours
        const args = ctx.message.text.split('/createprediction ')[1];
        if (!args) {
            return ctx.reply(`
                ❌ Invalid format. Please use:
                /createprediction name | description | optionA | optionB | hours

                Example:
                /createprediction Bitcoin Price | Will BTC be above 80k? | Yes | No | 24`
            );
        }

        const [name, description, optionA, optionB, hours] = args.split('|').map(item => item.trim());

        // 验证参数
        if (!name || !description || !optionA || !optionB || !hours) {
            return ctx.reply('❌ Missing parameters. Please provide all required information.');
        }

        const duration = Number(hours);
        if (!Number.isInteger(duration) || duration <= 0) {
            return ctx.reply('❌ Duration must be a positive integer (hours)');
        }

        // 获取用户的钱包信息
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ Wallet not found. Please use /generatewallet first');
        }

        // 发送创建预测市场交易
        await ctx.reply('🎯 *Creating prediction market...*', { parse_mode: 'Markdown' });

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const account = new Account(provider, walletData.address, walletData.privateKey);

        const predictionContract = new Contract(PredictionABI, PREDICTION_ADDRESS, account);

        // 计算截止时间（当前时间 + 小时数）
        const deadline = (Math.floor(Date.now() / 1000) + (duration * 3600));

        const outcomesTul = cairo.tuple(shortString.encodeShortString(optionA), shortString.encodeShortString(optionB))

        // 执行创建预测市场交易
        const tx = await account.execute({
            contractAddress: PREDICTION_ADDRESS,
            entrypoint: 'create_market',
            calldata: CallData.compile([
                walletData.address,           // owner
                GAME_TOKEN_ADDRESS,           // token
                byteArray.byteArrayFromString(name),     // name
                byteArray.byteArrayFromString(description),     // description
                outcomesTul,          // outcomes
                byteArray.byteArrayFromString("pic"),          // image (empty for now)
                deadline.toString()           // deadline
            ])
        });

        let receipt = await provider.waitForTransaction(tx.transaction_hash);  //tx.transaction_hash

        const url = 'https://sepolia.voyager.online/tx/' + tx.transaction_hash;

        const events = predictionContract.parseEvents(receipt);
        const eventData = Object.values(events[0])[0];

        // 发送创建成功信息
        await ctx.reply(
            '🎯 *Prediction Market Created Successfully*\n\n' +
            `ID: *${eventData.market.market_id.toString()}*\n` +
            `Name: *${eventData.market.name}*\n` +
            `Description: *${eventData.market.description}*\n` +
            `Option A: *${optionA}*\n` +
            `Option B: *${optionB}*\n` +
            `Deadline: *${formatDeadline(deadline)}*\n` +
            `Transaction: ${url}\n\n` +
            'Users can now place bets on this market.',
            {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            }
        );

    } catch (error) {
        console.error('Failed to create prediction market:', error);
        await ctx.reply('❌ Failed to create prediction market. Please try again later.');
    }
}

function formatDeadline(timestamp) {
    const timestampNum = Number(timestamp);
    const date = new Date(timestampNum * 1000);
    const utcString = date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
    }).replace(',', '');

    return `${utcString} (UTC+0)`;
}



export async function handleGetMarket(ctx) {
    try {
        const args = ctx.message.text.split(' ');
        if (args.length !== 2) {
            return ctx.reply(`
❌ Invalid format. Please use:
/getmarket <market_id>

Example:
/getmarket 1`);
        }

        const marketId = args[1];

        if (!Number.isInteger(Number(marketId)) || Number(marketId) <= 0) {
            return ctx.reply('❌ Market ID must be a positive integer');
        }

        // 获取用户钱包
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ Wallet not found. Please use /generatewallet first');
        }

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const contract = new Contract(PredictionABI, PREDICTION_ADDRESS, provider);

        const marketInfo = await contract.get_market(marketId);
        console.log("Market info:", marketInfo);

        if (!marketInfo) {
            return ctx.reply('❌ Market not found');
        }

        const outcome1Shares = ethers.utils.formatEther(marketInfo.outcomes[0].bought_shares);
        const outcome2Shares = ethers.utils.formatEther(marketInfo.outcomes[1].bought_shares);
        const totalPool = ethers.utils.formatEther(marketInfo.money_in_pool);

        // 检查市场状态
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = Number(marketInfo.deadline) <= currentTime;

        let statusEmoji;
        let status;
        if (marketInfo.is_settled) {
            statusEmoji = '🔒';
            status = 'Settled';
        } else if (isExpired) {
            statusEmoji = '⏰';
            status = 'Expired (Pending Settlement)';
        } else if (marketInfo.is_active) {
            statusEmoji = '🟢';
            status = 'Active';
        } else {
            statusEmoji = '🔸';
            status = 'Inactive';
        }

        // 根据市场状态决定是否显示按钮
        let messageOptions = {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        };

        // 只有在市场未结算、未过期且处于活跃状态时才添加按钮
        if (!marketInfo.is_settled && !isExpired && marketInfo.is_active) {
            messageOptions.reply_markup = {
                inline_keyboard: [
                    [
                        {
                            text: `📈 ${shortString.decodeShortString(marketInfo.outcomes[0].name)} (${outcome1Shares} shares)`,
                            callback_data: `bet_${marketId}_0`
                        },
                        {
                            text: `📉 ${shortString.decodeShortString(marketInfo.outcomes[1].name)} (${outcome2Shares} shares)`,
                            callback_data: `bet_${marketId}_1`
                        }
                    ]
                ]
            };
        }

        // 计算剩余时间或已过期时间
        const timeString = isExpired
            ? `Expired ${formatTimeDifference(currentTime - Number(marketInfo.deadline))} ago`
            : `${formatTimeDifference(Number(marketInfo.deadline) - currentTime)} remaining`;

        // 构建消息内容
        let message = `
🎯 *Prediction Market #${marketId}*

${statusEmoji} Status: *${status}*

📊 *Market Details*
Name: *${marketInfo.name}*
Description: *${marketInfo.description}*

💰 *Pool Information*
Total Pool: *${totalPool} TOKEN*
Deadline: *${formatDeadline(marketInfo.deadline)}*
⏳ Time: *${timeString}*

📈 *Options*
0️⃣ *${shortString.decodeShortString(marketInfo.outcomes[0].name)}*: ${outcome1Shares} shares
1️⃣ *${shortString.decodeShortString(marketInfo.outcomes[1].name)}*: ${outcome2Shares} shares`;

        // 根据不同状态添加相应提示
        if (marketInfo.is_settled && marketInfo.winning_outcome && !marketInfo.winning_outcome.None) {
            const winnerName = shortString.decodeShortString(marketInfo.winning_outcome.Some.name);
            message += `\n\n🏆 *Winning Option: ${winnerName}*`;
            if (totalPool > 0) {
                message += `\n📢 Winners can claim rewards using /claimwinnings ${marketId}`;
            }
        } else if (isExpired) {
            message += `\n\n⏰ *Market has expired*\nWaiting for settlement by market owner.`;

            // 如果是市场所有者查看，提示可以结算
            if (marketInfo.owner.toString() === walletData?.address) {
                message += `\n📢 You can settle this market using /settlemarket ${marketId} <winning_option>`;
            }
        } else if (marketInfo.is_active) {
            message += `\n\nClick the buttons below to place your bet!
ℹ️ Forward this message to share with others`;
        } else {
            message += `\n\n⚠️ This market is no longer active.`;
        }

        await ctx.reply(message, messageOptions);

    } catch (error) {
        console.error('Failed to get market info:', error);
        await ctx.reply('❌ Failed to get market information. Please try again later.');
    }
}

// 格式化时间差异
function formatTimeDifference(seconds) {
    if (seconds < 60) {
        return `${seconds} seconds`;
    }
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''}`;
}


// 处理刷新按钮回调
export async function handleRefreshCallback(ctx) {
    try {
        const callbackData = ctx.callbackQuery.data;
        const marketId = callbackData.split('_')[1];

        // 重新获取市场信息并更新消息
        await ctx.answerCbQuery('Refreshing market info...');

        // 创建新的消息上下文并调用 handleGetMarket
        // const newCtx = {
        //     ...ctx,
        //     message: {
        //         ...ctx.callbackQuery.message,
        //         text: `/getmarket ${marketId}`
        //     }
        // };
        // await handleGetMarket(newCtx);

    } catch (error) {
        console.error('Error refreshing market info:', error);
        await ctx.answerCbQuery('Failed to refresh market info');
    }
}

export async function placeBet(ctx, marketId, option, amount) {
    try {
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            throw new Error('Wallet not found');
        }

        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const account = new Account(provider, walletData.address, walletData.privateKey);

        // 执行下注交易
        const tx = await account.execute([
            {
                contractAddress: GAME_TOKEN_ADDRESS,
                entrypoint: 'approve',
                calldata: CallData.compile([
                    PREDICTION_ADDRESS,  // spender (红包合约地址)
                    cairo.uint256(ethers.utils.parseEther(amount).toString())        // amount
                ])
            },
            {
                contractAddress: PREDICTION_ADDRESS,
                entrypoint: 'buy_shares',
                calldata: CallData.compile([
                    cairo.uint256(marketId),           // market_id
                    option,            // token_to_mint
                    cairo.uint256(ethers.utils.parseEther(amount).toString()) // amount
                ])
            }
        ]);

        let res = await provider.waitForTransaction(tx.transaction_hash);
        console.log("Transaction result:", res);

        const url = 'https://sepolia.voyager.online/tx/' + tx.transaction_hash;

        await ctx.reply(
            '✅ *Bet Placed Successfully*\n\n' +
            `Amount: *${amount} TOKEN*\n` +
            `Option: *${option}*\n` +
            `Transaction: ${url}`,
            {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            }
        );

    } catch (error) {
        console.error('Error placing bet:', error);
        throw error;
    }
}


export async function handleSettleMarket(ctx) {
    try {
        // 解析命令参数 /settlemarket <market_id> <winning_option>
        const args = ctx.message.text.split(' ');
        if (args.length !== 3) {
            return ctx.reply(`
❌ Invalid format. Please use:
/settlemarket <market_id> <winning_option>

Example:
/settlemarket 1 0     // Settle market #1 with option 0 as winner
/settlemarket 2 1     // Settle market #2 with option 1 as winner`);
        }

        const marketId = args[1];
        const winningOption = args[2];

        // 验证参数
        if (!Number.isInteger(Number(marketId)) || Number(marketId) <= 0) {
            return ctx.reply('❌ Market ID must be a positive integer');
        }

        if (winningOption !== '0' && winningOption !== '1') {
            return ctx.reply('❌ Winning option must be 0 or 1');
        }

        // 获取用户钱包
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ Wallet not found. Please use /generatewallet first');
        }

        // 连接到合约
        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const account = new Account(provider, walletData.address, walletData.privateKey);

        // 先获取市场信息验证
        const contract = new Contract(PredictionABI, PREDICTION_ADDRESS, provider);

        const marketInfo = await contract.get_market(marketId);

        if (!marketInfo) {
            return ctx.reply('❌ Market not found');
        }

        // 验证市场状态
        if (marketInfo.is_settled) {
            return ctx.reply('❌ Market has already been settled');
        }

        let marketInfoOwner = '0x' + (marketInfo.owner).toString(16)

        if (formatStarknetAddress(marketInfoOwner) !== formatStarknetAddress(walletData.address)) {
            return ctx.reply('❌ Only market owner can settle the market');
        }

        // if (Number(marketInfo.deadline) > Math.floor(Date.now() / 1000)) {
        //     return ctx.reply('❌ Market has not reached deadline yet');
        // }

        // 发送结算交易
        await ctx.reply('🎯 *Settling market...*', { parse_mode: 'Markdown' });

        const tx = await account.execute({
            contractAddress: PREDICTION_ADDRESS,
            entrypoint: 'settle_market',
            calldata: CallData.compile([
                cairo.uint256(marketId),                 // market_id
                parseInt(winningOption)   // winning_outcome
            ])
        });

        let res = await provider.waitForTransaction(tx.transaction_hash);
        console.log("Settlement result:", res);

        const url = 'https://sepolia.voyager.online/tx/' + tx.transaction_hash;

        // 获取选项名称
        const winningOptionName = shortString.decodeShortString(marketInfo.outcomes[parseInt(winningOption)].name);

        // 发送成功消息
        await ctx.reply(
            '✅ *Market Settled Successfully*\n\n' +
            `Market ID: *${marketId}*\n` +
            `Winning Option: *${winningOptionName}* \n` +
            `Transaction: ${url}\n\n` +
            'Users can now claim their winnings using /claimwinnings',
            {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            }
        );

    } catch (error) {
        console.error('Failed to settle market:', error);
        let errorMessage = '❌ Failed to settle market.';

        if (error.message.includes('Not owner')) {
            errorMessage = '❌ Only the market owner can settle this market.';
        } else if (error.message.includes('Market not settled')) {
            errorMessage = '❌ Market cannot be settled yet.';
        }

        await ctx.reply(errorMessage + ' Please try again later.');
    }
}



export async function handleClaimWinnings(ctx) {
    try {
        // 解析命令参数 /claimwinnings <market_id>
        const args = ctx.message.text.split(' ');
        if (args.length !== 2) {
            return ctx.reply(`
❌ Invalid format. Please use:
/claimwinnings <market_id>

Example:
/claimwinnings 1`);
        }

        const marketId = args[1];

        // 验证参数
        if (!Number.isInteger(Number(marketId)) || Number(marketId) <= 0) {
            return ctx.reply('❌ Market ID must be a positive integer');
        }

        // 获取用户钱包
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ Wallet not found. Please use /generatewallet first');
        }

        // 连接到合约
        const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL });
        const account = new Account(provider, walletData.address, walletData.privateKey);

        // 使用统一的 PredictionABI
        const contract = new Contract(PredictionABI, PREDICTION_ADDRESS, provider);
        const contractWithSigner = new Contract(PredictionABI, PREDICTION_ADDRESS, account);

        // 获取市场信息
        const marketInfo = await contract.get_market(marketId);

        if (!marketInfo) {
            return ctx.reply('❌ Market not found');
        }

        // 检查市场是否已结算
        if (!marketInfo.is_settled) {
            return ctx.reply('❌ Market has not been settled yet');
        }

        // 获取用户下注信息
        const userBet = await contract.get_user_bet(walletData.address, marketId);
        
        if (!userBet || userBet.position.amount.toString() === '0') {
            return ctx.reply('❌ You have no bets in this market');
        }

        if (userBet.position.has_claimed) {
            return ctx.reply('❌ You have already claimed your winnings from this market');
        }


        // 检查是否获胜
        if (userBet.outcome.name !== Object.values(marketInfo.winning_outcome)[0].name) {
            return ctx.reply('❌ Sorry, your bet did not win in this market');
        }

        // 发送领取奖励的交易
        await ctx.reply('🎯 *Claiming winnings...*', { parse_mode: 'Markdown' });

        const tx = await account.execute([
            {
                contractAddress: PREDICTION_ADDRESS,
                entrypoint: 'claim_winnings',
                calldata: CallData.compile([
                    cairo.uint256(marketId),      // market_id
                ])
            }
        ]);

        let res = await provider.waitForTransaction(tx.transaction_hash);
        console.log("Claim result:", res);

        const url = 'https://sepolia.voyager.online/tx/' + tx.transaction_hash;


        // 发送成功消息
        await ctx.reply(
            '✅ *Winnings Claimed Successfully*\n\n' +
            `Market: *${marketInfo.name}*\n` +
            `Transaction: ${url}`,
            {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            }
        );

    } catch (error) {
        console.error('Failed to claim winnings:', error);
        let errorMessage = '❌ Failed to claim winnings.';
        
        if (error.message.includes('User has claimed winnings')) {
            errorMessage = '❌ You have already claimed your winnings from this market.';
        } else if (error.message.includes('User did not win')) {
            errorMessage = '❌ Sorry, your bet did not win in this market.';
        } else if (error.message.includes('Market not settled')) {
            errorMessage = '❌ This market has not been settled yet.';
        }

        await ctx.reply(errorMessage + ' Please try again later.');
    }
}
