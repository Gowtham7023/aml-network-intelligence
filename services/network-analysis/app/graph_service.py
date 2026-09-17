import networkx as nx


def build_graph(transactions):
    """
    Constructs a directed transaction network graph using NetworkX.
    Extracts topological features, circular patterns, multi-hop layering,
    high-degree account hubs, and cross-border transfers.
    """
    graph = nx.DiGraph()

    if not transactions:
        return {
            "nodes": [],
            "edges": [],
            "nodeCount": 0,
            "edgeCount": 0,
            "connectedComponents": 0,
            "circularPatterns": [],
            "multiHopChains": [],
            "highlyConnectedAccounts": [],
            "crossBorderTransactions": []
        }

    for tx in transactions:
        source = tx.get("fromAccountId")
        target = tx.get("toAccountId")
        try:
            amount = float(tx.get("amount") or 0)
        except (ValueError, TypeError):
            amount = 0.0

        country = tx.get("country") or "India"

        if not source or not target:
            continue

        if not graph.has_node(source):
            graph.add_node(source, countries=set())
        if not graph.has_node(target):
            graph.add_node(target, countries=set())

        graph.nodes[source]["countries"].add(country)
        graph.nodes[target]["countries"].add(country)

        is_cross_border = country.strip().lower() != "india"

        if graph.has_edge(source, target):
            graph[source][target]["totalAmount"] += amount
            graph[source][target]["transactions"] += 1
            graph[source][target]["countries"].add(country)
            if is_cross_border:
                graph[source][target]["isCrossBorder"] = True
        else:
            graph.add_edge(
                source,
                target,
                totalAmount=amount,
                transactions=1,
                countries={country},
                isCrossBorder=is_cross_border
            )

    # 1. Circular Transaction Patterns (Cycles in directed graph)
    circular_patterns = []
    cycle_nodes = set()
    cycle_edges = set()
    try:
        raw_cycles = list(nx.simple_cycles(graph))
        for cycle in raw_cycles:
            if len(cycle) >= 2:
                # Format with loop closure, e.g. ['A', 'B', 'C', 'A']
                closed_cycle = cycle + [cycle[0]]
                circular_patterns.append(closed_cycle)
                cycle_nodes.update(cycle)
                for i in range(len(cycle)):
                    cycle_edges.add((cycle[i], cycle[(i + 1) % len(cycle)]))
    except Exception:
        pass

    # 2. Multi-hop Layering Chains (Paths of length >= 3 hops / 4 nodes)
    raw_chains = []
    try:
        nodes_list = list(graph.nodes)
        for s in nodes_list:
            for t in nodes_list:
                if s != t:
                    for p in nx.all_simple_paths(graph, source=s, target=t, cutoff=5):
                        if len(p) >= 4:
                            raw_chains.append(p)
    except Exception:
        pass

    # Filter for maximal non-redundant layering chains (longest paths first)
    multi_hop_chains = []
    for chain in sorted(raw_chains, key=len, reverse=True):
        chain_str = "->".join(chain)
        if not any(chain_str in "->".join(existing) for existing in multi_hop_chains):
            multi_hop_chains.append(chain)
            if len(multi_hop_chains) >= 10:
                break

    # 3. Highly Connected Accounts (In-degree or Out-degree or Total degree hubs)
    # Use threshold: total connections >= 4 or (in_degree >= 2 and out_degree >= 2)
    highly_connected_accounts = []
    for node in graph.nodes:
        deg = graph.degree(node)
        in_deg = graph.in_degree(node)
        out_deg = graph.out_degree(node)
        if deg >= 4 or (in_deg >= 2 and out_deg >= 2) or (deg >= 3 and graph.number_of_nodes() <= 6):
            highly_connected_accounts.append(node)

    # 4. Cross-Border Activity
    cross_border_txs = []
    for source, target, data in graph.edges(data=True):
        if data.get("isCrossBorder", False):
            cross_border_txs.append({
                "source": source,
                "target": target,
                "amount": data["totalAmount"],
                "countries": list(data.get("countries", []))
            })

    # 5. Weakly Connected Components
    connected_components = (
        nx.number_weakly_connected_components(graph)
        if graph.number_of_nodes() > 0
        else 0
    )

    # 6. Format Nodes (Preserving exact frontend contract with enriched topology)
    nodes = [
        {
            "id": node,
            "connections": graph.degree(node),
            "inDegree": graph.in_degree(node),
            "outDegree": graph.out_degree(node),
            "totalInAmount": sum(
                graph[u][node]["totalAmount"] for u in graph.predecessors(node)
            ),
            "totalOutAmount": sum(
                graph[node][v]["totalAmount"] for v in graph.successors(node)
            ),
            "isHighDegree": node in highly_connected_accounts,
            "inCycle": node in cycle_nodes
        }
        for node in graph.nodes
    ]

    # 7. Format Edges (Preserving exact frontend contract with enriched details)
    edges = [
        {
            "source": source,
            "target": target,
            "amount": data["totalAmount"],
            "transactions": data["transactions"],
            "isCrossBorder": data.get("isCrossBorder", False),
            "inCycle": (source, target) in cycle_edges,
            "countries": list(data.get("countries", []))
        }
        for source, target, data in graph.edges(data=True)
    ]

    return {
        "nodes": nodes,
        "edges": edges,
        "nodeCount": graph.number_of_nodes(),
        "edgeCount": graph.number_of_edges(),
        "connectedComponents": connected_components,
        "circularPatterns": circular_patterns,
        "multiHopChains": multi_hop_chains,
        "highlyConnectedAccounts": highly_connected_accounts,
        "crossBorderTransactions": cross_border_txs
    }